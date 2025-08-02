import React, { useState } from 'react';

const UserSettings = ({ user, language = 'ar', isRTL = true, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    // Display Settings
    theme: localStorage.getItem('theme') || 'modern',
    language: localStorage.getItem('language') || 'ar',
    
    // Notification Settings
    emailNotifications: user?.settings?.emailNotifications !== false,
    pushNotifications: user?.settings?.pushNotifications !== false,
    smsNotifications: user?.settings?.smsNotifications !== false,
    
    // Privacy Settings
    showOnlineStatus: user?.settings?.showOnlineStatus !== false,
    allowDirectMessages: user?.settings?.allowDirectMessages !== false,
    
    // Work Settings
    autoLogout: user?.settings?.autoLogout || 30,
    defaultView: user?.settings?.defaultView || 'dashboard',
    
    // Data & Backup
    dataRetention: user?.settings?.dataRetention || 90,
    autoBackup: user?.settings?.autoBackup !== false
  });

  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('language', settings.language);
      
      // Save to backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        onSave && onSave(settings);
        alert(language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
        
        // Apply settings immediately
        if (settings.language !== localStorage.getItem('language')) {
          window.location.reload(); // Reload to apply language change
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(language === 'ar' ? 'خطأ في حفظ الإعدادات' : 'Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من إعادة تعيين الإعدادات للافتراضية؟' : 'Are you sure you want to reset settings to default?')) {
      setSettings({
        theme: 'modern',
        language: 'ar',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        showOnlineStatus: true,
        allowDirectMessages: true,
        autoLogout: 30,
        defaultView: 'dashboard',
        dataRetention: 90,
        autoBackup: true
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="modal-header">
          <h3>{language === 'ar' ? 'إعدادات المستخدم' : 'User Settings'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Display Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎨 {language === 'ar' ? 'إعدادات العرض' : 'Display Settings'}
              </h4>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المظهر' : 'Theme'}
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="modern">{language === 'ar' ? 'حديث' : 'Modern'}</option>
                    <option value="minimal">{language === 'ar' ? 'بسيط' : 'Minimal'}</option>
                    <option value="glassy">{language === 'ar' ? 'زجاجي' : 'Glassy'}</option>
                    <option value="dark">{language === 'ar' ? 'داكن' : 'Dark'}</option>
                    <option value="white">{language === 'ar' ? 'أبيض' : 'White'}</option>
                    <option value="neon">{language === 'ar' ? 'نيون' : 'Neon'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اللغة' : 'Language'}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الصفحة الافتراضية' : 'Default View'}
                  </label>
                  <select
                    value={settings.defaultView}
                    onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="dashboard">{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</option>
                    <option value="orders">{language === 'ar' ? 'الطلبات' : 'Orders'}</option>
                    <option value="clinics">{language === 'ar' ? 'العيادات' : 'Clinics'}</option>
                    <option value="visits">{language === 'ar' ? 'الزيارات' : 'Visits'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔔 {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </h4>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'الإشعارات المباشرة' : 'Push Notifications'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'رسائل SMS' : 'SMS Notifications'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔒 {language === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}
              </h4>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'إظهار حالة الاتصال' : 'Show Online Status'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showOnlineStatus}
                      onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'السماح بالرسائل المباشرة' : 'Allow Direct Messages'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowDirectMessages}
                      onChange={(e) => handleSettingChange('allowDirectMessages', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'تسجيل خروج تلقائي (بالدقائق)' : 'Auto Logout (minutes)'}
                  </label>
                  <select
                    value={settings.autoLogout}
                    onChange={(e) => handleSettingChange('autoLogout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 {language === 'ar' ? 'دقيقة' : 'minutes'}</option>
                    <option value={30}>30 {language === 'ar' ? 'دقيقة' : 'minutes'}</option>
                    <option value={60}>60 {language === 'ar' ? 'دقيقة' : 'minutes'}</option>
                    <option value={120}>120 {language === 'ar' ? 'دقيقة' : 'minutes'}</option>
                    <option value={0}>{language === 'ar' ? 'أبداً' : 'Never'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data & Backup Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💾 {language === 'ar' ? 'البيانات والنسخ الاحتياطي' : 'Data & Backup'}
              </h4>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'مدة الاحتفاظ بالبيانات (بالأيام)' : 'Data Retention (days)'}
                  </label>
                  <select
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 {language === 'ar' ? 'يوم' : 'days'}</option>
                    <option value={60}>60 {language === 'ar' ? 'يوم' : 'days'}</option>
                    <option value={90}>90 {language === 'ar' ? 'يوم' : 'days'}</option>
                    <option value={180}>180 {language === 'ar' ? 'يوم' : 'days'}</option>
                    <option value={365}>365 {language === 'ar' ? 'يوم' : 'days'}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'نسخ احتياطي تلقائي' : 'Auto Backup'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Actions */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⚠️ {language === 'ar' ? 'إجراءات متقدمة' : 'Advanced Actions'}
            </h4>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
              >
                {language === 'ar' ? 'إعادة تعيين للافتراضي' : 'Reset to Defaults'}
              </button>
              
              <button
                onClick={() => {
                  const data = JSON.stringify(settings, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `user-settings-${user.username}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                {language === 'ar' ? 'تصدير الإعدادات' : 'Export Settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading 
              ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
              : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;