// Enhanced Visits Management Component - إدارة الزيارات المحسن (تم تحديثه لحل مشكلة Mixed Content)
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';

const EnhancedVisitsManagement = ({ language = 'ar', theme = 'dark', user }) => {
  const [visits, setVisits] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    clinic_id: '',
    visit_type: 'routine',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: '',
    priority: 'medium'
  });

  const { t, tc, tm } = useGlobalTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    loadVisits();
    loadClinics();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/visits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClinics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/clinics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  };

  const handleCreateVisit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/visits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newVisit = await response.json();
        setVisits([...visits, newVisit]);
        setShowCreateModal(false);
        setFormData({
          clinic_id: '',
          visit_type: 'routine',
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          notes: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  return (
    <div className="visits-management p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <span className="text-blue-600 ml-3 text-4xl">🏥</span>
          إدارة الزيارات المحسنة
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <span className="ml-2">➕</span>
          إنشاء زيارة جديدة
        </button>
      </div>

      {/* Visits List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-indigo-600 ml-3 text-2xl">📋</span>
            قائمة الزيارات
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">جاري تحميل الزيارات...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">لا توجد زيارات للعرض</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {visits.map((visit) => (
              <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {visit.clinic_name || 'عيادة غير محددة'}
                    </h3>
                    <div className="space-y-1 text-gray-600">
                      <p><strong>نوع الزيارة:</strong> {visit.visit_type}</p>
                      <p><strong>التاريخ:</strong> {visit.visit_date}</p>
                      <p><strong>الوقت:</strong> {visit.visit_time}</p>
                      {visit.notes && <p><strong>ملاحظات:</strong> {visit.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      visit.priority === 'high' ? 'bg-red-100 text-red-800' :
                      visit.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {visit.priority === 'high' ? 'عالية' : 
                       visit.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Visit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">إنشاء زيارة جديدة</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العيادة</label>
                <select
                  value={formData.clinic_id}
                  onChange={(e) => setFormData({...formData, clinic_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر العيادة</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الزيارة</label>
                <select
                  value={formData.visit_type}
                  onChange={(e) => setFormData({...formData, visit_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="routine">زيارة روتينية</option>
                  <option value="urgent">زيارة عاجلة</option>
                  <option value="follow_up">متابعة</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
                  <input
                    type="time"
                    value={formData.visit_time}
                    onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل أي ملاحظات إضافية..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateVisit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                إنشاء الزيارة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVisitsManagement;