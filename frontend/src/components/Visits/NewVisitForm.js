// New Visit Registration Form - نموذج تسجيل الزيارة الجديد
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import { activityLogger } from '../../utils/activityLogger.js';
import axios from 'axios';

const NewVisitForm = ({ user, language, isRTL, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().split(' ')[0].substring(0,5),
    managers: [], // Multiple managers selection
    visit_effectiveness: '', // فعالية الزيارة
    order_status: '', // حالة الطلب
    visit_notes: '',
    products_discussed: [],
    samples_given: [],
    next_visit_date: ''
  });
  
  const [clinics, setClinics] = useState([]);
  const [managers, setManagers] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchClinics();
    fetchManagers();
    fetchProducts();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
          console.log('✅ Location obtained for visit:', position.coords);
          setLocationLoading(false);
        },
        (error) => {
          console.error('❌ Location error:', error);
          alert('لا يمكن الحصول على الموقع الحالي. الموقع مطلوب لتسجيل الزيارة.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      alert('المتصفح لا يدعم خدمات الموقع');
      setLocationLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      // Mock data for development
      setClinics([
        {
          id: 'clinic-001',
          name: 'عيادة الدكتور أحمد محمد',
          doctor_name: 'د. أحمد محمد علي',
          specialization: 'باطنة عامة',
          classification: 'A',
          address: 'شارع الجمهورية، المنصورة'
        },
        {
          id: 'clinic-002', 
          name: 'مركز النيل الطبي',
          doctor_name: 'د. فاطمة سعد',
          specialization: 'أمراض قلب',
          classification: 'B',
          address: 'شارع النيل، القاهرة'
        }
      ]);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/users?role=manager,district_manager,gm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      // Mock data
      setManagers([
        { id: 'mgr-001', full_name: 'أحمد المدير', role: 'district_manager' },
        { id: 'mgr-002', full_name: 'سارة مديرة المبيعات', role: 'manager' }
      ]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Mock data
      setProducts([
        { id: 'prod-001', name: 'أموكسيسيلين 500mg', unit: 'ڤايل' },
        { id: 'prod-002', name: 'فيتامين د3', unit: 'علبة' }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManagerSelection = (managerId) => {
    setFormData(prev => ({
      ...prev,
      managers: prev.managers.includes(managerId)
        ? prev.managers.filter(id => id !== managerId)
        : [...prev.managers, managerId]
    }));
  };

  const handleProductSelection = (productId) => {
    setFormData(prev => ({
      ...prev,
      products_discussed: prev.products_discussed.includes(productId)
        ? prev.products_discussed.filter(id => id !== productId)
        : [...prev.products_discussed, productId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentLocation) {
      alert('يجب الحصول على الموقع الحالي قبل تسجيل الزيارة');
      getCurrentLocation();
      return;
    }

    if (!formData.clinic_id) {
      alert('يرجى اختيار عيادة');
      return;
    }

    if (formData.managers.length === 0) {
      alert('يرجى اختيار مدير واحد على الأقل');
      return;
    }

    setLoading(true);

    try {
      const visitData = {
        ...formData,
        medical_rep_id: user.id,
        medical_rep_name: user.full_name,
        location: currentLocation,
        visit_datetime: `${formData.visit_date}T${formData.visit_time}:00.000Z`,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API}/visits`, visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Log the visit activity
      await activityLogger.logVisit(response.data.id, formData.clinic_id, {
        clinic_name: clinics.find(c => c.id === formData.clinic_id)?.name,
        visit_effectiveness: formData.visit_effectiveness,
        order_status: formData.order_status,
        managers_notified: formData.managers,
        products_discussed: formData.products_discussed,
        location: currentLocation,
        rep_name: user.full_name,
        rep_role: user.role
      });

      alert('تم تسجيل الزيارة بنجاح');
      onSave && onSave(response.data);
      onClose();
      
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('حدث خطأ أثناء تسجيل الزيارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">🏥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">تسجيل زيارة جديدة</h2>
                <p className="text-sm text-white/70">تسجيل زيارة للعيادة مع تتبع الموقع</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Location Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                currentLocation ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                <span>{locationLoading ? '⏳' : currentLocation ? '📍' : '❌'}</span>
                <span className="text-xs">
                  {locationLoading ? 'جاري تحديد الموقع...' : 
                   currentLocation ? 'تم تحديد الموقع' : 'فشل في تحديد الموقع'}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Visit Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinic Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  اختيار العيادة *
                </label>
                <select
                  value={formData.clinic_id}
                  onChange={(e) => handleInputChange('clinic_id', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                >
                  <option value="">اختر العيادة</option>
                  {clinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id} className="text-black">
                      {clinic.name} - {clinic.doctor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  تاريخ الزيارة *
                </label>
                <input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => handleInputChange('visit_date', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                />
              </div>

              {/* Visit Time */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  وقت الزيارة *
                </label>
                <input
                  type="time"
                  value={formData.visit_time}
                  onChange={(e) => handleInputChange('visit_time', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                />
              </div>

              {/* Visit Effectiveness */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  فعالية الزيارة *
                </label>
                <select
                  value={formData.visit_effectiveness}
                  onChange={(e) => handleInputChange('visit_effectiveness', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                >
                  <option value="">اختر فعالية الزيارة</option>
                  <option value="excellent" className="text-black">ممتازة</option>
                  <option value="very_good" className="text-black">جيدة جداً</option>
                  <option value="good" className="text-black">جيدة</option>
                  <option value="average" className="text-black">متوسطة</option>
                  <option value="poor" className="text-black">ضعيفة</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  حالة الطلب *
                </label>
                <select
                  value={formData.order_status}
                  onChange={(e) => handleInputChange('order_status', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                >
                  <option value="">اختر حالة الطلب</option>
                  <option value="ordered" className="text-black">تم الطلب</option>
                  <option value="interested" className="text-black">مهتم</option>
                  <option value="considering" className="text-black">تحت الدراسة</option>
                  <option value="no_order" className="text-black">لا يوجد طلب</option>
                  <option value="follow_up" className="text-black">متابعة لاحقة</option>
                </select>
              </div>

              {/* Next Visit Date */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  تاريخ الزيارة القادمة
                </label>
                <input
                  type="date"
                  value={formData.next_visit_date}
                  onChange={(e) => handleInputChange('next_visit_date', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
              </div>
            </div>

            {/* Managers Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                اختيار المدراء للإشعار * (متعدد)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {managers.map(manager => (
                  <label key={manager.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.managers.includes(manager.id)}
                      onChange={() => handleManagerSelection(manager.id)}
                      className="w-5 h-5 text-green-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{manager.full_name}</div>
                      <div className="text-white/60 text-xs">{manager.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Products Discussed */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                المنتجات التي تم مناقشتها
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                {products.map(product => (
                  <label key={product.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.products_discussed.includes(product.id)}
                      onChange={() => handleProductSelection(product.id)}
                      className="w-4 h-4 text-green-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm">{product.name}</div>
                      <div className="text-white/60 text-xs">{product.unit}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Visit Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                ملاحظات الزيارة
              </label>
              <textarea
                value={formData.visit_notes}
                onChange={(e) => handleInputChange('visit_notes', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white resize-none"
                placeholder="أضف ملاحظات حول الزيارة..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !currentLocation}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    تسجيل الزيارة
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

export default NewVisitForm;