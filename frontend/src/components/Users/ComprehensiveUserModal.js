// Comprehensive User Details and Edit Modal - مودال شامل لتفاصيل وتعديل المستخدم
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ComprehensiveUserModal = ({ user, mode, onClose, onUserUpdated, language = 'ar' }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState({});
  const [availableManagers, setAvailableManagers] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [availableClinics, setAvailableClinics] = useState([]);

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    if (user?.id) {
      loadComprehensiveProfile();
      loadSupportingData();
    }
  }, [user?.id]);

  const loadComprehensiveProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔄 Loading comprehensive profile for user:', user.id);
      
      const response = await axios.get(`${API}/users/${user.id}/comprehensive-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Comprehensive profile response:', response.data);

      if (response.data?.success && response.data?.user_profile) {
        const profile = response.data.user_profile;
        setUserProfile(profile);
        
        // Initialize form data with current user data
        setFormData({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          role: profile.role || '',
          area_id: profile.area_id || '',
          department: profile.department || '',
          managed_by: profile.managed_by || '',
          line: profile.line || '', // إضافة الخط
          monthly_sales_target: profile.monthly_sales_target || 50000,
          is_active: profile.is_active !== false,
          assigned_clinic_ids: profile.comprehensive_data?.assigned_clinics?.map(c => c.id) || [],
          password: '' // إضافة حقل كلمة المرور
        });
        
        console.log('✅ Comprehensive profile loaded successfully');
      } else {
        // استخدام بيانات المستخدم الأساسية إذا فشل تحميل البيانات الشاملة
        console.log('⚠️ Using basic user data as fallback');
        setUserProfile(user);
        setFormData({
          full_name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || '',
          area_id: user.area_id || '',
          department: user.department || '',
          managed_by: user.managed_by || '',
          line: user.line || '',
          monthly_sales_target: user.monthly_sales_target || 50000,
          is_active: user.is_active !== false,
          assigned_clinic_ids: [],
          password: '' // إضافة حقل كلمة المرور
        });
      }
    } catch (error) {
      console.error('❌ Error loading comprehensive profile:', error);
      
      // استخدام بيانات المستخدم الأساسية كحل احتياطي
      console.log('🔄 Using basic user data as error fallback');
      setUserProfile(user);
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        area_id: user.area_id || '',
        department: user.department || '',
        managed_by: user.managed_by || '',
        line: user.line || '',
        monthly_sales_target: user.monthly_sales_target || 50000,
        is_active: user.is_active !== false,
        assigned_clinic_ids: [],
        password: '' // إضافة حقل كلمة المرور
      });
      
      // لا نُظهر خطأ للمستخدم، بل نستخدم البيانات الأساسية
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Load managers
      const managersResponse = await axios.get(`${API}/users?role=manager,admin,gm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (managersResponse.data) {
        setAvailableManagers(managersResponse.data.filter(u => u.id !== user.id));
      }

      // Load areas
      const areasResponse = await axios.get(`${API}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (areasResponse.data) {
        setAvailableAreas(areasResponse.data);
      }

      // Load clinics (for medical reps)
      if (user.role === 'medical_rep' || user.role === 'key_account') {
        const clinicsResponse = await axios.get(`${API}/clinics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (clinicsResponse.data) {
          setAvailableClinics(clinicsResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading supporting data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClinicSelection = (clinicId) => {
    setFormData(prev => ({
      ...prev,
      assigned_clinic_ids: prev.assigned_clinic_ids.includes(clinicId)
        ? prev.assigned_clinic_ids.filter(id => id !== clinicId)
        : [...prev.assigned_clinic_ids, clinicId]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.put(`${API}/users/${user.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.message) {
        alert('✅ تم تحديث بيانات المستخدم بنجاح');
        setIsEditing(false);
        loadComprehensiveProfile(); // Reload updated data
        if (onUserUpdated) onUserUpdated();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء تحديث البيانات';
      alert(`❌ خطأ في التحديث: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'مدير النظام',
      'gm': 'مدير عام',
      'manager': 'مدير',
      'medical_rep': 'مندوب طبي',
      'key_account': 'مسؤول حسابات رئيسية',
      'accounting': 'محاسب',
      'warehouse_keeper': 'أمين مخزن'
    };
    return labels[role] || role;
  };

  if (loading && !userProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات الشاملة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {userProfile?.full_name?.charAt(0) || '👤'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? 'تعديل بيانات المستخدم' : 'تفاصيل المستخدم الشاملة'}
              </h2>
              <p className="text-blue-100">{userProfile?.full_name} - {getRoleLabel(userProfile?.role)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>✏️</span>
                تعديل
              </button>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span>💾</span>
                  حفظ التغييرات
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>❌</span>
                  إلغاء
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full max-h-[calc(95vh-100px)]">
          
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'basic', name: 'المعلومات الأساسية', icon: '👤' },
                { id: 'performance', name: 'الأداء والمبيعات', icon: '📊' },
                { id: 'clinics', name: 'العيادات والزيارات', icon: '🏥' },
                { id: 'debts', name: 'المديونيات والتحصيل', icon: '💰' },
                { id: 'hierarchy', name: 'التسلسل الإداري', icon: '🏢' },
                { id: 'products', name: 'المنتجات المتاحة', icon: '📦' },
                { id: 'accounting', name: 'الربط المحاسبي', icon: '🧮' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>

            {/* Data Completeness */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2">اكتمال البيانات</h4>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${userProfile?.data_completeness || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {Math.round(userProfile?.data_completeness || 0)}% مكتمل
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>👤</span>
                    المعلومات الأساسية
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="bg-gray-50 px-4 py-3 rounded-lg">{userProfile?.full_name || 'غير محدد'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="bg-gray-50 px-4 py-3 rounded-lg">{userProfile?.email || 'غير محدد'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="bg-gray-50 px-4 py-3 rounded-lg">{userProfile?.phone || 'غير محدد'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الدور الوظيفي</label>
                      {isEditing ? (
                        <select
                          name="role"
                          value={formData.role || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">اختر الدور</option>
                          <option value="admin">مدير النظام</option>
                          <option value="gm">مدير عام</option>
                          <option value="manager">مدير</option>
                          <option value="medical_rep">مندوب طبي</option>
                          <option value="key_account">مسؤول حسابات رئيسية</option>
                          <option value="accounting">محاسب</option>
                          <option value="warehouse_keeper">أمين مخزن</option>
                        </select>
                      ) : (
                        <p className="bg-gray-50 px-4 py-3 rounded-lg">{getRoleLabel(userProfile?.role)}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="department"
                          value={formData.department || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="bg-gray-50 px-4 py-3 rounded-lg">{userProfile?.department || 'غير محدد'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حالة النشاط</label>
                      {isEditing ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active || false}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span>مستخدم نشط</span>
                        </label>
                      ) : (
                        <p className={`px-4 py-3 rounded-lg ${userProfile?.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {userProfile?.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password Change Section */}
                  {isEditing && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4">تغيير كلمة المرور</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            placeholder="اتركها فارغة إذا كنت لا تريد تغييرها"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Sales Performance Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <span>💰</span>
                      أداء المبيعات
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي المبيعات:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(userProfile?.comprehensive_data?.sales_performance?.total_sales)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي الطلبات:</span>
                        <span className="font-bold">
                          {formatNumber(userProfile?.comprehensive_data?.sales_performance?.total_orders)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">متوسط قيمة الطلب:</span>
                        <span className="font-bold">
                          {formatCurrency(userProfile?.comprehensive_data?.sales_performance?.avg_order_value)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Achievement */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      تحقيق الأهداف
                    </h4>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">الهدف الشهري (ج.م)</label>
                        <input
                          type="number"
                          name="monthly_sales_target"
                          value={formData.monthly_sales_target || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">الهدف الشهري:</span>
                          <span className="font-bold">
                            {formatCurrency(userProfile?.comprehensive_data?.performance_metrics?.monthly_target)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">التحقيق:</span>
                          <span className={`font-bold ${getPerformanceColor(userProfile?.comprehensive_data?.performance_metrics?.target_achievement)}`}>
                            {Math.round(userProfile?.comprehensive_data?.performance_metrics?.target_achievement || 0)}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(userProfile?.comprehensive_data?.performance_metrics?.target_achievement || 0, 100)}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-center text-sm font-medium text-gray-700">
                          {userProfile?.comprehensive_data?.performance_metrics?.performance_rating}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Visit Statistics */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                      <span>🚗</span>
                      إحصائيات الزيارات
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي الزيارات:</span>
                        <span className="font-bold">
                          {formatNumber(userProfile?.comprehensive_data?.visit_statistics?.total_visits)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">زيارات الشهر:</span>
                        <span className="font-bold">
                          {formatNumber(userProfile?.comprehensive_data?.visit_statistics?.visits_this_month)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">تكرار الزيارة:</span>
                        <span className="font-bold">
                          {(userProfile?.comprehensive_data?.visit_statistics?.visit_frequency || 0).toFixed(1)} مرة/عيادة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clinics Tab */}
            {activeTab === 'clinics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>🏥</span>
                    العيادات المخصصة
                  </h3>

                  {isEditing && (userProfile?.role === 'medical_rep' || userProfile?.role === 'key_account') ? (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">اختر العيادات المخصصة لهذا المستخدم:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                        {availableClinics.map((clinic) => (
                          <label key={clinic.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.assigned_clinic_ids?.includes(clinic.id) || false}
                              onChange={() => handleClinicSelection(clinic.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{clinic.name}</p>
                              <p className="text-sm text-gray-500">{clinic.owner_name}</p>
                              <p className="text-xs text-gray-400">{clinic.location}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProfile?.comprehensive_data?.assigned_clinics?.length > 0 ? (
                        userProfile.comprehensive_data.assigned_clinics.map((clinic) => (
                          <div key={clinic.id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-800">{clinic.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                clinic.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {clinic.is_active ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">المالك: {clinic.owner_name}</p>
                            <p className="text-xs text-gray-500">{clinic.location}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          لا توجد عيادات مخصصة
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debts Tab */}
            {activeTab === 'debts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Outstanding Debts */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border">
                    <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                      <span>⚠️</span>
                      الديون المستحقة
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {formatNumber(userProfile?.comprehensive_data?.debt_management?.outstanding_debts)}
                        </div>
                        <div className="text-sm text-red-700">دين مستحق</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(userProfile?.comprehensive_data?.debt_management?.debt_summary_by_status?.outstanding?.amount)}
                        </div>
                        <div className="text-xs text-red-600">إجمالي المبلغ</div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Performance */}
                  {userProfile?.comprehensive_data?.collection_performance && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border">
                      <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                        <span>💵</span>
                        أداء التحصيل
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatNumber(userProfile.comprehensive_data.collection_performance.payments_processed)}
                          </div>
                          <div className="text-sm text-green-700">دفعة معالجة</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(userProfile.comprehensive_data.collection_performance.total_amount_collected)}
                          </div>
                          <div className="text-xs text-green-600">إجمالي المحصل</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debt Management Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <span>📋</span>
                      حالة إدارة الديون
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي الديون:</span>
                        <span className="font-bold">
                          {formatNumber(userProfile?.comprehensive_data?.debt_management?.total_debts)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">مسؤولية التحصيل:</span>
                        <span className={`font-bold px-2 py-1 rounded text-xs ${
                          userProfile?.comprehensive_data?.debt_management?.collection_responsibility 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {userProfile?.comprehensive_data?.debt_management?.collection_responsibility ? 'نعم' : 'لا'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hierarchy Tab */}
            {activeTab === 'hierarchy' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Manager Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>👨‍💼</span>
                      المدير المباشر
                    </h4>
                    
                    {isEditing ? (
                      <select
                        name="managed_by"
                        value={formData.managed_by || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">بدون مدير مباشر</option>
                        {availableManagers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name} - {getRoleLabel(manager.role)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        {userProfile?.comprehensive_data?.reporting_manager ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-800">
                              {userProfile.comprehensive_data.reporting_manager.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getRoleLabel(userProfile.comprehensive_data.reporting_manager.role)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {userProfile.comprehensive_data.reporting_manager.email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">لا يوجد مدير مباشر</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Direct Reports */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>👥</span>
                      المرؤوسين المباشرين ({userProfile?.comprehensive_data?.direct_reports?.length || 0})
                    </h4>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {userProfile?.comprehensive_data?.direct_reports?.length > 0 ? (
                        userProfile.comprehensive_data.direct_reports.map((subordinate) => (
                          <div key={subordinate.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-800">{subordinate.name}</p>
                            <p className="text-sm text-gray-600">{getRoleLabel(subordinate.role)}</p>
                            <p className="text-xs text-gray-500">{subordinate.email}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">لا يوجد مرؤوسين مباشرين</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>📦</span>
                    المنتجات المتاحة للطلب
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userProfile?.comprehensive_data?.available_products?.length > 0 ? (
                      userProfile.comprehensive_data.available_products.map((product) => (
                        <div key={product.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.can_order ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {product.can_order ? 'متاح' : 'غير متاح'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">الفئة: {product.category}</p>
                            <p className="text-gray-600">الوحدة: {product.unit}</p>
                            <p className="text-gray-600">السعر: {formatCurrency(product.price)}</p>
                            <p className="text-gray-600">المخزون: {formatNumber(product.current_stock)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-gray-500">
                        لا توجد منتجات متاحة للطلب
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Accounting Tab */}
            {activeTab === 'accounting' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>🧮</span>
                    الربط المحاسبي والإحصائيات المالية
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(userProfile?.comprehensive_data?.sales_performance?.total_sales)}
                      </div>
                      <div className="text-sm text-blue-700">إجمالي الإيرادات</div>
                    </div>

                    {/* Outstanding Debts */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(userProfile?.comprehensive_data?.debt_management?.debt_summary_by_status?.outstanding?.amount)}
                      </div>
                      <div className="text-sm text-red-700">الديون المستحقة</div>
                    </div>

                    {/* Collections */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(userProfile?.comprehensive_data?.collection_performance?.total_amount_collected)}
                      </div>
                      <div className="text-sm text-green-700">إجمالي المحصل</div>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(userProfile?.comprehensive_data?.sales_performance?.avg_order_value)}
                      </div>
                      <div className="text-sm text-purple-700">متوسط قيمة الطلب</div>
                    </div>
                  </div>

                  {/* Accounting Integration Status */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">حالة التكامل المحاسبي</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ربط الفواتير:</span>
                        <span className="text-green-600 font-medium">✅ مفعل</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">تتبع المديونيات:</span>
                        <span className="text-green-600 font-medium">✅ مفعل</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">تقارير الحسابات:</span>
                        <span className="text-green-600 font-medium">✅ متاح</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-700">جاري المعالجة...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveUserModal;