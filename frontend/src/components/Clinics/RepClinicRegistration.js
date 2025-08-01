// Clinic Registration Component - تسجيل العيادات
import React, { useState } from 'react';
import { useTranslation } from '../../localization/translations.js';

const RepClinicRegistration = ({ user, language, isRTL }) => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    doctor_name: '',
    phone: '',
    address: '',
    specialization: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const { t } = useTranslation(language);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('تم تسجيل العيادة بنجاح!');
      setFormData({
        clinic_name: '',
        doctor_name: '',
        phone: '',
        address: '',
        specialization: '',
        latitude: '',
        longitude: ''
      });
    } catch (error) {
      setError('حدث خطأ أثناء تسجيل العيادة');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="clinic-registration-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">🏥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('clinics', 'registerClinic')}</h1>
            <p className="text-lg opacity-75">إضافة عيادة طبية جديدة إلى النظام</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          ❌ {error}
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📋</span>
              المعلومات الأساسية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'clinicName')} *
                </label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل اسم العيادة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'doctorName')} *
                </label>
                <input
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل اسم الطبيب"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'clinicPhone')} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل رقم الهاتف"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'specialization')}
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر التخصص</option>
                  <option value="general">طب عام</option>
                  <option value="internal">باطنة</option>
                  <option value="cardiology">قلب</option>
                  <option value="dermatology">جلدية</option>
                  <option value="orthopedics">عظام</option>
                  <option value="pediatrics">أطفال</option>
                  <option value="gynecology">نساء وولادة</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                {t('clinics', 'clinicAddress')} *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="أدخل عنوان العيادة التفصيلي"
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📍</span>
              معلومات الموقع
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  خط العرض (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="30.0444"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  خط الطول (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="31.2357"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm flex items-center gap-2">
                <span>💡</span>
                يمكنك الحصول على إحداثيات الموقع من Google Maps أو سيتم تحديد الموقع تلقائياً عند التسجيل
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <span>✅</span>
                  تسجيل العيادة
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>❓</span>
          مساعدة
        </h3>
        <div className="space-y-2 text-sm opacity-75">
          <p>• تأكد من إدخال جميع المعلومات المطلوبة بدقة</p>
          <p>• يتم حفظ موقعك الحالي تلقائياً مع تسجيل العيادة</p>
          <p>• سيتم مراجعة طلب التسجيل من قبل الإدارة</p>
          <p>• ستحصل على إشعار عند الموافقة على التسجيل</p>
        </div>
      </div>
    </div>
  );
};

export default RepClinicRegistration;