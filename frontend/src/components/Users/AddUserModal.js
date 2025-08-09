// Add User Modal - مودال إضافة مستخدم جديد - FIXED VERSION
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
    line: '',
    managed_by: '',
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

      const managersResponse = await axios.get(`${API}/users`, { headers });
      const managersData = managersResponse.data.filter(user => 
        user.role === 'manager' || user.role === 'admin'
      );
      setManagers(managersData);

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

  // Inline styles to ensure visibility
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  };

  const modalContentStyle = {
    background: '#1e293b',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    position: 'relative',
    color: '#ffffff'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#e2e8f0',
    fontSize: '14px'
  };

  return (
    <div style={modalOverlayStyle} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #475569'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
          </h3>
          <button 
            onClick={onClose} 
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              lineHeight: 1,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Username */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'} *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.username ? '#ef4444' : '#475569'
                  }}
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  disabled={loading}
                />
                {errors.username && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.password ? '#ef4444' : '#475569'
                  }}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                  disabled={loading}
                />
                {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
              </div>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.full_name ? '#ef4444' : '#475569'
                  }}
                  placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                  disabled={loading}
                />
                {errors.full_name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.email ? '#ef4444' : '#475569'
                  }}
                  placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  disabled={loading}
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone'} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.phone ? '#ef4444' : '#475569'
                  }}
                  placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  disabled={loading}
                />
                {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
              </div>

              {/* Role */}
              <div>
                <label style={labelStyle}>
                  {language === 'ar' ? 'الدور' : 'Role'} *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={inputStyle}
                  disabled={loading}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value} style={{ background: '#334155', color: '#ffffff' }}>
                      {language === 'ar' ? role.labelAr : role.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Status */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
                  {language === 'ar' ? 'المستخدم نشط' : 'User is active'}
                </span>
              </label>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 24px 24px 24px',
            borderTop: '1px solid #475569'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                language === 'ar' ? 'إضافة المستخدم' : 'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddUserModal;