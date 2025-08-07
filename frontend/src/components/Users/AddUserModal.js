// Add User Modal - مودال إضافة مستخدم جديد
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddUserModal = ({ onClose, onUserAdded, language = 'ar' }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'medical_rep',
    department: '',
    area_id: '',
    line: '', // إضافة الخط
    managed_by: '', // إضافة المدير المباشر
    monthly_sales_target: 50000,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [managers, setManagers] = useState([]);
  const [areas, setAreas] = useState([]);

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  const roles = [
    { value: 'admin', labelAr: 'مدير النظام', labelEn: 'Admin' },
    { value: 'manager', labelAr: 'مدير', labelEn: 'Manager' },
    { value: 'medical_rep', labelAr: 'مندوب طبي', labelEn: 'Medical Rep' },
    { value: 'accountant', labelAr: 'محاسب', labelEn: 'Accountant' },
    { value: 'warehouse_keeper', labelAr: 'أمين مخزن', labelEn: 'Warehouse Keeper' }
  ];

  const lines = [
    { value: 'line1', labelAr: 'الخط الأول', labelEn: 'Line 1' },
    { value: 'line2', labelAr: 'الخط الثاني', labelEn: 'Line 2' }
  ];

  useEffect(() => {
    loadSupportingData();
  }, []);

  const loadSupportingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // تحميل المديرين
      const managersResponse = await axios.get(`${API}/users`, { headers });
      const managersData = managersResponse.data.filter(user => 
        user.role === 'manager' || user.role === 'admin'
      );
      setManagers(managersData);

      // تحميل المناطق
      const areasResponse = await axios.get(`${API}/areas`, { headers });
      setAreas(areasResponse.data || []);

      console.log('✅ Supporting data loaded:', { 
        managers: managersData.length, 
        areas: areasResponse.data?.length || 0 
      });
    } catch (error) {
      console.error('❌ Error loading supporting data:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = language === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API}/users`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ User created successfully:', response.data);
      alert(language === 'ar' ? 'تم إضافة المستخدم بنجاح!' : 'User added successfully!');
      
      if (onUserAdded) {
        onUserAdded(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      alert(language === 'ar' ? `خطأ في إضافة المستخدم: ${errorMsg}` : `Error adding user: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h3 className="text-2xl font-bold text-primary">
            {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
          </h3>
          <button 
            onClick={onClose} 
            className="modal-close text-muted hover:text-primary"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'} *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.username ? 'border-red-500' : 'border-primary'}`}
                placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                disabled={loading}
              />
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.password ? 'border-red-500' : 'border-primary'}`}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                disabled={loading}
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.full_name ? 'border-red-500' : 'border-primary'}`}
                placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                disabled={loading}
              />
              {errors.full_name && <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-primary'}`}
                placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                disabled={loading}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone'} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-primary'}`}
                placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                disabled={loading}
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'الدور' : 'Role'} *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-3 border border-primary rounded-lg"
                disabled={loading}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ar' ? role.labelAr : role.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'المنطقة' : 'Area'}
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full p-3 border border-primary rounded-lg"
                placeholder={language === 'ar' ? 'أدخل المنطقة' : 'Enter area'}
                disabled={loading}
              />
            </div>

            {/* Line */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'الخط' : 'Line'}
              </label>
              <input
                type="text"
                name="line"
                value={formData.line}
                onChange={handleInputChange}
                className="w-full p-3 border border-primary rounded-lg"
                placeholder={language === 'ar' ? 'أدخل الخط' : 'Enter line'}
                disabled={loading}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="mt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded"
                disabled={loading}
              />
              <span className="text-sm text-secondary">
                {language === 'ar' ? 'المستخدم نشط' : 'User is active'}
              </span>
            </label>
          </div>
        </form>
        
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') 
              : (language === 'ar' ? 'إضافة المستخدم' : 'Add User')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;