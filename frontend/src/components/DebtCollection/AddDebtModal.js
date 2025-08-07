// Add Debt Modal - مودال إضافة دين جديد
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddDebtModal = ({ onClose, onDebtAdded, language = 'ar', user }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    sales_rep_id: '',
    amount: '',
    description: '',
    payment_amount: '',
    payment_type: 'partial' // 'partial' or 'full'
  });
  
  const [clinics, setClinics] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [selectedRep, setSelectedRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [clinicsRes, usersRes] = await Promise.all([
        axios.get(`${API}/clinics`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/users`, { headers }).catch(() => ({ data: [] }))
      ]);

      setClinics(clinicsRes.data || []);
      setSalesReps((usersRes.data || []).filter(u => u.role === 'medical_rep'));
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    }
  };

  const handleSalesRepChange = (repId) => {
    const rep = salesReps.find(r => r.id === repId);
    setSelectedRep(rep);
    setFormData(prev => ({ ...prev, sales_rep_id: repId }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clinic_id) {
      newErrors.clinic_id = 'يرجى اختيار العيادة';
    }
    
    if (!formData.sales_rep_id) {
      newErrors.sales_rep_id = 'يرجى اختيار المندوب';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'يرجى إدخال مبلغ صالح';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'يرجى إدخال وصف الدين';
    }
    
    if (showPaymentSection && formData.payment_amount && parseFloat(formData.payment_amount) > parseFloat(formData.amount)) {
      newErrors.payment_amount = 'مبلغ السداد لا يمكن أن يكون أكبر من مبلغ الدين';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Create debt
      const debtPayload = {
        clinic_id: formData.clinic_id,
        sales_rep_id: formData.sales_rep_id,
        amount: parseFloat(formData.amount),
        description: formData.description
      };

      const debtResponse = await axios.post(`${API}/debts`, debtPayload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Debt created successfully:', debtResponse.data);
      
      // If payment amount is provided, process payment
      if (showPaymentSection && formData.payment_amount && parseFloat(formData.payment_amount) > 0) {
        const debtId = debtResponse.data.debt?.id;
        if (debtId) {
          try {
            const paymentPayload = {
              amount: parseFloat(formData.payment_amount),
              payment_method: 'cash',
              notes: `دفعة ${formData.payment_type === 'full' ? 'كاملة' : 'جزئية'} عند إضافة الدين`
            };

            await axios.post(`${API}/debts/${debtId}/payment`, paymentPayload, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('✅ Payment processed successfully');
          } catch (paymentError) {
            console.error('❌ Payment error:', paymentError);
            // Continue even if payment fails
          }
        }
      }

      alert('تم إضافة الدين بنجاح!');
      
      if (onDebtAdded) {
        onDebtAdded(debtResponse.data);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error creating debt:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      alert(`خطأ في إضافة الدين: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              إضافة دين جديد
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic Selection */}
            <div>
              <label className="form-label">اختيار العيادة *</label>
              <select
                value={formData.clinic_id}
                onChange={(e) => setFormData(prev => ({ ...prev, clinic_id: e.target.value }))}
                className="form-input"
                required
              >
                <option value="">اختر العيادة...</option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.owner_name}
                  </option>
                ))}
              </select>
              {errors.clinic_id && <p className="text-red-500 text-sm mt-1">{errors.clinic_id}</p>}
            </div>

            {/* Sales Rep Selection */}
            <div>
              <label className="form-label">اختيار المندوب *</label>
              <select
                value={formData.sales_rep_id}
                onChange={(e) => handleSalesRepChange(e.target.value)}
                className="form-input"
                required
              >
                <option value="">اختر المندوب...</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name} - {rep.username}
                  </option>
                ))}
              </select>
              {errors.sales_rep_id && <p className="text-red-500 text-sm mt-1">{errors.sales_rep_id}</p>}
            </div>

            {/* Rep Info Display */}
            {selectedRep && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">معلومات المندوب:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>المنطقة:</strong> {selectedRep.area || 'غير محدد'}</p>
                  <p><strong>الخط:</strong> {selectedRep.line || 'غير محدد'}</p>
                  <p><strong>الهاتف:</strong> {selectedRep.phone || 'غير محدد'}</p>
                  <p><strong>البريد الإلكتروني:</strong> {selectedRep.email || 'غير محدد'}</p>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="form-label">مبلغ الدين (ج.م) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="form-input"
                placeholder="أدخل مبلغ الدين..."
                required
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="form-label">وصف الدين *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
                rows="3"
                placeholder="أدخل تفاصيل الدين..."
                required
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Payment Section Toggle */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPaymentSection}
                  onChange={(e) => setShowPaymentSection(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">تسديد مبلغ عند إضافة الدين</span>
              </label>
            </div>

            {/* Payment Details */}
            {showPaymentSection && (
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-green-900">تفاصيل السداد:</h4>
                
                {/* Payment Type */}
                <div>
                  <label className="form-label">نوع السداد</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_type"
                        value="partial"
                        checked={formData.payment_type === 'partial'}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value }))}
                      />
                      <span>جزئي</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_type"
                        value="full"
                        checked={formData.payment_type === 'full'}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            payment_type: e.target.value,
                            payment_amount: e.target.value === 'full' ? prev.amount : prev.payment_amount
                          }));
                        }}
                      />
                      <span>كامل</span>
                    </label>
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="form-label">مبلغ السداد (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.amount}
                    value={formData.payment_type === 'full' ? formData.amount : formData.payment_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                    className="form-input"
                    placeholder="أدخل مبلغ السداد..."
                    disabled={formData.payment_type === 'full'}
                  />
                  {errors.payment_amount && <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>}
                  
                  {formData.amount && formData.payment_amount && (
                    <div className="text-sm text-gray-600 mt-1">
                      المبلغ المتبقي: {(parseFloat(formData.amount) - parseFloat(formData.payment_amount || 0)).toFixed(2)} ج.م
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'جارٍ الحفظ...' : 'إضافة الدين'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDebtModal;