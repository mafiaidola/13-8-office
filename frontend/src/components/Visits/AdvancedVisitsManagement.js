// Advanced Visits Management - إدارة الزيارات المتطورة والاحترافية
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const AdvancedVisitsManagement = ({ language = 'ar', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [visits, setVisits] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [areas, setAreas] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [filteredLines, setFilteredLines] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [formData, setFormData] = useState({
    area_id: '',
    line_id: '',
    clinic_id: '',
    visit_type: 'routine',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: '',
    priority: 'medium',
    objectives: [],
    expected_outcomes: '',
    follow_up_required: false
  });

  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    loadVisits();
    loadHierarchicalData();
  }, []);

  // تحميل البيانات الهرمية
  const loadHierarchicalData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // تحميل المناطق
      const areasResponse = await fetch(`${API}/areas`, { headers });
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData.areas || areasData || []);
      }

      // تحميل الخطوط
      const linesResponse = await fetch(`${API}/lines`, { headers });
      if (linesResponse.ok) {
        const linesData = await linesResponse.json();
        setLines(linesData.lines || linesData || []);
      }

      // تحميل العيادات
      const clinicsResponse = await fetch(`${API}/clinics`, { headers });
      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        setClinics(clinicsData.clinics || clinicsData || []);
      }
    } catch (error) {
      console.error('Error loading hierarchical data:', error);
    }
  };

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
        setVisits(data.visits || data || []);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // معالجة تغيير المنطقة
  const handleAreaChange = (areaId) => {
    setSelectedArea(areaId);
    setSelectedLine('');
    setSelectedClinic('');
    
    // تصفية الخطوط حسب المنطقة
    const filtered = lines.filter(line => line.area_id === areaId);
    setFilteredLines(filtered);
    setFilteredClinics([]);
    
    setFormData({
      ...formData,
      area_id: areaId,
      line_id: '',
      clinic_id: ''
    });
  };

  // معالجة تغيير الخط
  const handleLineChange = (lineId) => {
    setSelectedLine(lineId);
    setSelectedClinic('');
    
    // تصفية العيادات حسب الخط
    const filtered = clinics.filter(clinic => clinic.line_id === lineId);
    setFilteredClinics(filtered);
    
    setFormData({
      ...formData,
      line_id: lineId,
      clinic_id: ''
    });
  };

  // معالجة تغيير العيادة
  const handleClinicChange = (clinicId) => {
    setSelectedClinic(clinicId);
    setFormData({
      ...formData,
      clinic_id: clinicId
    });
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
        const visitData = newVisit.visit || newVisit;
        setVisits([...visits, visitData]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      area_id: '',
      line_id: '',
      clinic_id: '',
      visit_type: 'routine',
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      notes: '',
      priority: 'medium',
      objectives: [],
      expected_outcomes: '',
      follow_up_required: false
    });
    setSelectedArea('');
    setSelectedLine('');
    setSelectedClinic('');
    setFilteredLines([]);
    setFilteredClinics([]);
  };

  // الحصول على أيقونة نوع الزيارة
  const getVisitTypeIcon = (type) => {
    const icons = {
      routine: '📅',
      urgent: '🚨',
      follow_up: '🔄',
      emergency: '⚠️',
      consultation: '💬',
      presentation: '📊'
    };
    return icons[type] || '📝';
  };

  // الحصول على لون الأولوية
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-50 text-green-700 border-green-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-red-50 text-red-700 border-red-200',
      urgent: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[priority] || colors.medium;
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="advanced-visits-management min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">🏥</span>
                إدارة الزيارات المتطورة والاحترافية
              </h1>
              <p className="text-blue-100 text-lg">
                نظام متطور لإدارة زيارات المندوبين مع التنظيم الهرمي الذكي والتخطيط المتقدم
              </p>
            </div>
            
            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                <span className="ml-3 text-2xl">➕</span>
                إنشاء زيارة جديدة
              </button>
              
              <button
                onClick={loadVisits}
                disabled={loading}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? '⏳' : '🔄'} تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">إجمالي الزيارات</p>
                <p className="text-3xl font-bold text-blue-600">{visits.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">زيارات اليوم</p>
                <p className="text-3xl font-bold text-green-600">
                  {visits.filter(v => v.visit_date === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">زيارات عاجلة</p>
                <p className="text-3xl font-bold text-red-600">
                  {visits.filter(v => v.priority === 'urgent' || v.priority === 'high').length}
                </p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">متابعات مطلوبة</p>
                <p className="text-3xl font-bold text-purple-600">
                  {visits.filter(v => v.follow_up_required).length}
                </p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-indigo-600 ml-3 text-3xl">📋</span>
              سجل الزيارات التفصيلي
            </h2>
            <p className="text-gray-600 mt-1">
              عرض شامل لجميع الزيارات مع التفاصيل والحالة والأولوية
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600 text-lg">جاري تحميل الزيارات...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد زيارات مسجلة</h3>
              <p className="text-gray-600 mb-6">ابدأ بإنشاء زيارة جديدة لرؤية السجل هنا</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                إنشاء أول زيارة
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visits.map((visit, index) => (
                <div key={visit.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4 space-x-reverse flex-1">
                      <div className="text-4xl">
                        {getVisitTypeIcon(visit.visit_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl text-gray-900 mb-1">
                            {visit.clinic_name || `زيارة ${visit.visit_type}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(visit.priority)}`}>
                            {visit.priority === 'low' ? 'منخفضة' :
                             visit.priority === 'medium' ? 'متوسطة' :
                             visit.priority === 'high' ? 'عالية' : 'عاجلة'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <strong className="text-gray-700">نوع الزيارة:</strong>
                            <div className="text-gray-600">
                              {visit.visit_type === 'routine' ? 'روتينية' :
                               visit.visit_type === 'urgent' ? 'عاجلة' :
                               visit.visit_type === 'follow_up' ? 'متابعة' : visit.visit_type}
                            </div>
                          </div>
                          <div>
                            <strong className="text-gray-700">التاريخ:</strong>
                            <div className="text-gray-600">{formatDate(visit.visit_date)}</div>
                          </div>
                          <div>
                            <strong className="text-gray-700">الوقت:</strong>
                            <div className="text-gray-600">{visit.visit_time}</div>
                          </div>
                          <div>
                            <strong className="text-gray-700">المتابعة:</strong>
                            <div className={`font-semibold ${visit.follow_up_required ? 'text-orange-600' : 'text-green-600'}`}>
                              {visit.follow_up_required ? 'مطلوبة' : 'غير مطلوبة'}
                            </div>
                          </div>
                        </div>
                        
                        {visit.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <strong className="text-gray-700 block mb-1">ملاحظات:</strong>
                            <p className="text-gray-600">{visit.notes}</p>
                          </div>
                        )}
                        
                        {visit.expected_outcomes && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-3">
                            <strong className="text-blue-700 block mb-1">النتائج المتوقعة:</strong>
                            <p className="text-blue-600">{visit.expected_outcomes}</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-3 space-x-reverse">
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm">
                            📄 عرض التفاصيل
                          </button>
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all text-sm">
                            ✏️ تعديل
                          </button>
                          {visit.follow_up_required && (
                            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all text-sm">
                              🔄 متابعة
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Create Visit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="ml-3 text-3xl">🏥</span>
                إنشاء زيارة جديدة - النظام الهرمي المتطور
              </h3>
              <p className="text-gray-600 mt-1">
                اختر المنطقة، ثم الخط، ثم العيادة المحددة لتنظيم مثالي
              </p>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Hierarchical Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="ml-3 text-2xl">🌍</span>
                  التحديد الهرمي للعيادة
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Areas Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="ml-2">📍</span>
                      المنطقة الجغرافية
                    </label>
                    <div className="space-y-2">
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          onClick={() => handleAreaChange(area.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedArea === area.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold">{area.name}</div>
                          <div className="text-sm text-gray-600">{area.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lines Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="ml-2">🛤️</span>
                      الخط التجاري
                    </label>
                    {!selectedArea ? (
                      <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 text-center text-gray-500">
                        اختر المنطقة أولاً
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredLines.map((line) => (
                          <div
                            key={line.id}
                            onClick={() => handleLineChange(line.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedLine === line.id
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-semibold">{line.name}</div>
                            <div className="text-sm text-gray-600">{line.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clinics Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="ml-2">🏥</span>
                      العيادة المحددة
                    </label>
                    {!selectedLine ? (
                      <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 text-center text-gray-500">
                        اختر الخط أولاً
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredClinics.map((clinic) => (
                          <div
                            key={clinic.id}
                            onClick={() => handleClinicChange(clinic.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedClinic === clinic.id
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-semibold">{clinic.name}</div>
                            <div className="text-sm text-gray-600">{clinic.doctor_name}</div>
                            <div className="text-xs text-gray-500">{clinic.address}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="ml-3 text-2xl">📝</span>
                  تفاصيل الزيارة المتقدمة
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الزيارة</label>
                    <select
                      value={formData.visit_type}
                      onChange={(e) => setFormData({...formData, visit_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="routine">🗓️ زيارة روتينية</option>
                      <option value="urgent">🚨 زيارة عاجلة</option>
                      <option value="follow_up">🔄 زيارة متابعة</option>
                      <option value="emergency">⚠️ طوارئ</option>
                      <option value="consultation">💬 استشارة</option>
                      <option value="presentation">📊 عرض تقديمي</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">🟢 منخفضة</option>
                      <option value="medium">🟡 متوسطة</option>
                      <option value="high">🔴 عالية</option>
                      <option value="urgent">🟣 عاجلة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الزيارة</label>
                    <input
                      type="date"
                      value={formData.visit_date}
                      onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وقت الزيارة</label>
                    <input
                      type="time"
                      value={formData.visit_time}
                      onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">النتائج المتوقعة</label>
                  <input
                    type="text"
                    value={formData.expected_outcomes}
                    onChange={(e) => setFormData({...formData, expected_outcomes: e.target.value})}
                    placeholder="ما هي النتائج المتوقعة من هذه الزيارة؟"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات تفصيلية</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="4"
                    placeholder="أضف أي ملاحظات أو تفاصيل إضافية حول الزيارة..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.follow_up_required}
                      onChange={(e) => setFormData({...formData, follow_up_required: e.target.checked})}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="mr-3 text-sm font-medium text-gray-700">
                      🔄 تتطلب هذه الزيارة متابعة لاحقة
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-semibold"
                >
                  🔄 إعادة تعيين
                </button>
                <button
                  onClick={handleCreateVisit}
                  disabled={!selectedClinic}
                  className={`px-8 py-3 font-semibold rounded-lg transition-all ${
                    selectedClinic
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ✅ إنشاء الزيارة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedVisitsManagement;