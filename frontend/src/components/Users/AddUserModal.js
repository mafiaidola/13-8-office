// Add User Modal - مودال إضافة مستخدم جديد - COMPLETE VERSION
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
    area: '',
    line: '',
    managed_by: '',
    monthly_sales_target: 50000,
    is_active: true,
    // إضافة الحقول المفقودة
    employee_id: '',
    national_id: '',
    address: '',
    hire_date: '',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: '',
    salary: '',
    commission_rate: 5,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [managers, setManagers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [lines, setLines] = useState([]);

  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  const roles = [
    { value: 'admin', labelAr: 'مدير النظام', labelEn: 'Admin' },
    { value: 'manager', labelAr: 'مدير', labelEn: 'Manager' },
    { value: 'gm', labelAr: 'مدير عام', labelEn: 'General Manager' },
    { value: 'medical_rep', labelAr: 'مندوب طبي', labelEn: 'Medical Rep' },
    { value: 'accountant', labelAr: 'محاسب', labelEn: 'Accountant' },
    { value: 'accounting', labelAr: 'محاسبة', labelEn: 'Accounting' },
    { value: 'warehouse_keeper', labelAr: 'أمين مخزن', labelEn: 'Warehouse Keeper' },
    { value: 'warehouse_manager', labelAr: 'مدير مخزن', labelEn: 'Warehouse Manager' },
    { value: 'line_manager', labelAr: 'مدير خط', labelEn: 'Line Manager' }
  ];

  useEffect(() => {
    loadSupportingData();
  }, []);

  const loadSupportingData = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('🔄 جاري تحميل البيانات المساعدة...');

      // تحميل المديرين من API المستخدمين
      try {
        const managersResponse = await axios.get(`${API}/users`, { headers });
        const managersData = managersResponse.data.filter(user => 
          ['manager', 'admin', 'gm', 'line_manager'].includes(user.role) && user.is_active
        );
        setManagers(managersData);
        console.log('✅ تم تحميل المديرين:', managersData.length);
      } catch (error) {
        console.error('❌ خطأ في تحميل المديرين:', error);
        setManagers([]);
      }

      // تحميل المناطق
      try {
        const areasResponse = await axios.get(`${API}/areas`, { headers });
        if (areasResponse.data && Array.isArray(areasResponse.data)) {
          setAreas(areasResponse.data);
          console.log('✅ تم تحميل المناطق:', areasResponse.data.length);
        } else {
          console.log('⚠️ لا توجد مناطق متاحة');
          setAreas([]);
        }
      } catch (error) {
        console.error('❌ خطأ في تحميل المناطق:', error);
        setAreas([]);
      }

      // تحميل الخطوط
      try {
        const linesResponse = await axios.get(`${API}/lines`, { headers });
        if (linesResponse.data && Array.isArray(linesResponse.data)) {
          setLines(linesResponse.data);
          console.log('✅ تم تحميل الخطوط:', linesResponse.data.length);
        } else {
          // إنشاء خطوط افتراضية إذا لم تكن موجودة
          const defaultLines = [
            { id: 'line1', name: 'الخط الأول', is_active: true },
            { id: 'line2', name: 'الخط الثاني', is_active: true }
          ];
          setLines(defaultLines);
          console.log('⚠️ تم إنشاء خطوط افتراضية');
        }
      } catch (error) {
        console.error('❌ خطأ في تحميل الخطوط:', error);
        const defaultLines = [
          { id: 'line1', name: 'الخط الأول', is_active: true },
          { id: 'line2', name: 'الخط الثاني', is_active: true }
        ];
        setLines(defaultLines);
      }

      console.log('✅ تم تحميل جميع البيانات المساعدة');
    } catch (error) {
      console.error('❌ خطأ عام في تحميل البيانات:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // الحقول المطلوبة
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
      
      // إعداد البيانات للإرسال
      const submitData = {
        ...formData,
        monthly_sales_target: Number(formData.monthly_sales_target),
        salary: formData.salary ? Number(formData.salary) : null,
        commission_rate: Number(formData.commission_rate)
      };

      console.log('📤 إرسال بيانات المستخدم الجديد:', submitData);

      const response = await axios.post(`${API}/users`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ تم إنشاء المستخدم بنجاح:', response.data);
      alert(language === 'ar' ? 'تم إضافة المستخدم بنجاح!' : 'User added successfully!');
      
      if (onUserAdded) {
        onUserAdded(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
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
    maxWidth: '1000px',
    width: '100%',
    maxHeight: '90vh',
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

  const sectionStyle = {
    background: '#334155',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px'
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
        
        {/* Loading State */}
        {dataLoading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #475569',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#94a3b8' }}>جاري تحميل البيانات...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px' }}>
              
              {/* القسم الأول: المعلومات الأساسية */}
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '16px' }}>
                  المعلومات الأساسية
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {/* Username */}
                  <div>
                    <label style={labelStyle}>اسم المستخدم *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      style={{...inputStyle, borderColor: errors.username ? '#ef4444' : '#475569'}}
                      placeholder="أدخل اسم المستخدم"
                      disabled={loading}
                    />
                    {errors.username && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>كلمة المرور *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      style={{...inputStyle, borderColor: errors.password ? '#ef4444' : '#475569'}}
                      placeholder="أدخل كلمة المرور"
                      disabled={loading}
                    />
                    {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>الاسم الكامل *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      style={{...inputStyle, borderColor: errors.full_name ? '#ef4444' : '#475569'}}
                      placeholder="أدخل الاسم الكامل"
                      disabled={loading}
                    />
                    {errors.full_name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.full_name}</p>}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label style={labelStyle}>رقم الموظف</label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="أدخل رقم الموظف"
                      disabled={loading}
                    />
                  </div>

                  {/* National ID */}
                  <div>
                    <label style={labelStyle}>الرقم القومي</label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="أدخل الرقم القومي"
                      disabled={loading}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label style={labelStyle}>الدور *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={loading}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value} style={{ background: '#334155', color: '#ffffff' }}>
                          {role.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* القسم الثاني: معلومات الاتصال */}
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '16px' }}>
                  معلومات الاتصال
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {/* Email */}
                  <div>
                    <label style={labelStyle}>البريد الإلكتروني *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={{...inputStyle, borderColor: errors.email ? '#ef4444' : '#475569'}}
                      placeholder="أدخل البريد الإلكتروني"
                      disabled={loading}
                    />
                    {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>رقم الهاتف *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{...inputStyle, borderColor: errors.phone ? '#ef4444' : '#475569'}}
                      placeholder="أدخل رقم الهاتف"
                      disabled={loading}
                    />
                    {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label style={labelStyle}>اسم جهة الاتصال في الحالات الطارئة</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="اسم المتصل في الطوارئ"
                      disabled={loading}
                    />
                  </div>

                  {/* Emergency Phone */}
                  <div>
                    <label style={labelStyle}>رقم الطوارئ</label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="رقم الهاتف للطوارئ"
                      disabled={loading}
                    />
                  </div>

                  {/* Address */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>العنوان</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="أدخل العنوان الكامل"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* القسم الثالث: التقسيم الإداري */}
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '16px' }}>
                  التقسيم الإداري
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  
                  {/* المدير المباشر */}
                  <div>
                    <label style={labelStyle}>المدير المباشر</label>
                    <select
                      name="managed_by"
                      value={formData.managed_by}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={loading}
                    >
                      <option value="" style={{ background: '#334155', color: '#ffffff' }}>
                        بدون مدير مباشر
                      </option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id} style={{ background: '#334155', color: '#ffffff' }}>
                          {manager.full_name} - {manager.role === 'admin' ? 'مدير النظام' : manager.role === 'gm' ? 'مدير عام' : 'مدير'}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      المديرين المتاحين: {managers.length}
                    </p>
                  </div>

                  {/* المنطقة */}
                  <div>
                    <label style={labelStyle}>المنطقة</label>
                    <select
                      name="area_id"
                      value={formData.area_id}
                      onChange={(e) => {
                        const selectedArea = areas.find(area => area.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          area_id: e.target.value,
                          area: selectedArea ? selectedArea.name : ''
                        }));
                      }}
                      style={inputStyle}
                      disabled={loading}
                    >
                      <option value="" style={{ background: '#334155', color: '#ffffff' }}>
                        اختر المنطقة
                      </option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id} style={{ background: '#334155', color: '#ffffff' }}>
                          {area.name} {area.is_active ? '' : '(غير نشط)'}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      المناطق المتاحة: {areas.length}
                    </p>
                  </div>

                  {/* الخط */}
                  <div>
                    <label style={labelStyle}>الخط</label>
                    <select
                      name="line"
                      value={formData.line}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={loading}
                    >
                      <option value="" style={{ background: '#334155', color: '#ffffff' }}>
                        اختر الخط
                      </option>
                      {lines.map(line => (
                        <option key={line.id} value={line.id} style={{ background: '#334155', color: '#ffffff' }}>
                          {line.name} {line.is_active ? '' : '(غير نشط)'}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      الخطوط المتاحة: {lines.length}
                    </p>
                  </div>

                  {/* Department */}
                  <div>
                    <label style={labelStyle}>القسم</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="أدخل اسم القسم"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* القسم الرابع: المعلومات المالية والوظيفية */}
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '16px' }}>
                  المعلومات المالية والوظيفية
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  
                  {/* Hire Date */}
                  <div>
                    <label style={labelStyle}>تاريخ التوظيف</label>
                    <input
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={loading}
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label style={labelStyle}>تاريخ الميلاد</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={loading}
                    />
                  </div>

                  {/* Salary */}
                  <div>
                    <label style={labelStyle}>الراتب الأساسي</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="0"
                      disabled={loading}
                    />
                  </div>

                  {/* Monthly Sales Target */}
                  <div>
                    <label style={labelStyle}>الهدف الشهري للمبيعات</label>
                    <input
                      type="number"
                      name="monthly_sales_target"
                      value={formData.monthly_sales_target}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="50000"
                      disabled={loading}
                    />
                  </div>

                  {/* Commission Rate */}
                  <div>
                    <label style={labelStyle}>نسبة العمولة (%)</label>
                    <input
                      type="number"
                      name="commission_rate"
                      value={formData.commission_rate}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* القسم الخامس: ملاحظات وإعدادات */}
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '16px' }}>
                  ملاحظات وإعدادات
                </h4>
                
                {/* Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>ملاحظات</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    style={{...inputStyle, height: '80px', resize: 'vertical'}}
                    placeholder="أي ملاحظات إضافية عن الموظف..."
                    disabled={loading}
                  />
                </div>

                {/* Active Status */}
                <div>
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
                      المستخدم نشط
                    </span>
                  </label>
                </div>
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
                إلغاء
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
                    جاري الحفظ...
                  </>
                ) : (
                  'إضافة المستخدم'
                )}
              </button>
            </div>
          </form>
        )}
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