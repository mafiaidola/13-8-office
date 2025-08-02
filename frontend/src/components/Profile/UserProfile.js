import React, { useState, useEffect } from 'react';

const UserProfile = ({ user, language = 'ar', isRTL = true, onClose, onSave }) => {
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    department: user?.department || '',
    direct_manager: user?.direct_manager || '',
    line: user?.line || '',
    region: user?.region || '',
    hire_date: user?.hire_date || '',
    status: user?.status || 'active'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onSave && onSave(updatedUser);
        setIsEditing(false);
        alert(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(language === 'ar' ? 'خطأ في حفظ التغييرات' : 'Error saving changes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="modal-header">
          <h3>{language === 'ar' ? 'الملف الشخصي' : 'User Profile'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture & Basic Info */}
            <div className="lg:col-span-1">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  {(profileData.full_name || profileData.username || 'U')[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {profileData.full_name || profileData.username}
                </h3>
                <p className="text-gray-600">
                  {language === 'ar' ? 'المندوب الطبي' : profileData.role}
                </p>
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profileData.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profileData.status === 'active' 
                      ? (language === 'ar' ? 'نشط' : 'Active')
                      : (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats'}
                </h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'الطلبات المكتملة' : 'Completed Orders'}
                  </span>
                  <span className="font-semibold">23</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'العيادات المسجلة' : 'Registered Clinics'}
                  </span>
                  <span className="font-semibold">8</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'الزيارات هذا الشهر' : 'Visits This Month'}
                  </span>
                  <span className="font-semibold">15</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'المبلغ المحصل' : 'Amount Collected'}
                  </span>
                  <span className="font-semibold">12,500 ج.م</span>
                </div>
              </div>
            </div>

            {/* Profile Details Form */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {language === 'ar' ? 'معلومات الملف الشخصي' : 'Profile Information'}
                </h4>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {isEditing 
                    ? (language === 'ar' ? 'إلغاء' : 'Cancel')
                    : (language === 'ar' ? 'تعديل' : 'Edit')
                  }
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                {/* Work Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                  </label>
                  <select
                    value={profileData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    disabled={!isEditing || user?.role !== 'admin'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  >
                    <option value="medical_rep">{language === 'ar' ? 'مندوب طبي' : 'Medical Rep'}</option>
                    <option value="line_manager">{language === 'ar' ? 'مدير خط' : 'Line Manager'}</option>
                    <option value="area_manager">{language === 'ar' ? 'مدير منطقة' : 'Area Manager'}</option>
                    <option value="accounting">{language === 'ar' ? 'محاسب' : 'Accounting'}</option>
                    <option value="admin">{language === 'ar' ? 'مدير النظام' : 'Admin'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'القسم' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المدير المباشر' : 'Direct Manager'}
                  </label>
                  <input
                    type="text"
                    value={profileData.direct_manager}
                    onChange={(e) => handleInputChange('direct_manager', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الخط' : 'Line'}
                  </label>
                  <input
                    type="text"
                    value={profileData.line}
                    onChange={(e) => handleInputChange('line', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المنطقة' : 'Region'}
                  </label>
                  <input
                    type="text"
                    value={profileData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}
                  </label>
                  <input
                    type="date"
                    value={profileData.hire_date}
                    onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
              </div>

              {/* Activity Log */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? 'سجل النشاط' : 'Activity Log'}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>تسجيل دخول للنظام</span>
                      <span className="text-gray-500">منذ 5 دقائق</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تحديث معلومات عيادة</span>
                      <span className="text-gray-500">منذ ساعة</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>إنشاء طلبية جديدة</span>
                      <span className="text-gray-500">منذ 3 ساعات</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>زيارة عيادة جديدة</span>
                      <span className="text-gray-500">أمس</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {loading 
                ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;