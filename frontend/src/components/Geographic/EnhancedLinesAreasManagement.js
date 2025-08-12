// Enhanced Lines Areas Management - إدارة الخطوط والمناطق المحسنة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const EnhancedLinesAreasManagement = ({ language = 'ar', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [activeTab, setActiveTab] = useState('lines');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager_id: '',
    line_id: '',
    is_active: true
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadLinesAreasData();
    loadUsers();
  }, []);

  const loadLinesAreasData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // تحميل الخطوط
      const linesResponse = await fetch(`${API_URL}/api/enhanced-lines-areas/lines`, { headers });
      if (linesResponse.ok) {
        const linesResult = await linesResponse.json();
        setLines(linesResult.lines || []);
      }

      // تحميل المناطق
      const areasResponse = await fetch(`${API_URL}/api/enhanced-lines-areas/areas`, { headers });
      if (areasResponse.ok) {
        const areasResult = await areasResponse.json();
        setAreas(areasResult.areas || []);
      }

      // تحميل الإحصائيات
      const statsResponse = await fetch(`${API_URL}/api/enhanced-lines-areas/statistics`, { headers });
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setStatistics(statsResult.statistics || {});
      }

    } catch (error) {
      console.error('خطأ في تحميل بيانات الخطوط والمناطق:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUsers(result.users || result || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      manager_id: '',
      line_id: '',
      is_active: true
    });
  };

  const openLineModal = (mode, line = null) => {
    setModalMode(mode);
    setSelectedLine(line);
    if (mode === 'edit' && line) {
      setFormData({
        name: line.name || '',
        code: line.code || '',
        description: line.description || '',
        manager_id: line.manager_id || '',
        line_id: '',
        is_active: line.is_active !== undefined ? line.is_active : true
      });
    } else {
      resetForm();
    }
    setShowLineModal(true);
  };

  const openAreaModal = (mode, area = null) => {
    setModalMode(mode);
    setSelectedArea(area);
    if (mode === 'edit' && area) {
      setFormData({
        name: area.name || '',
        code: area.code || '',
        description: area.description || '',
        manager_id: area.manager_id || '',
        line_id: area.line_id || '',
        is_active: area.is_active !== undefined ? area.is_active : true
      });
    } else {
      resetForm();
    }
    setShowAreaModal(true);
  };

  const handleLineSubmit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const url = modalMode === 'create' 
        ? `${API_URL}/api/enhanced-lines-areas/lines`
        : `${API_URL}/api/enhanced-lines-areas/lines/${selectedLine.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          manager_id: formData.manager_id || null,
          is_active: formData.is_active
        })
      });

      if (response.ok) {
        await loadLinesAreasData();
        setShowLineModal(false);
        resetForm();
        
        // تسجيل النشاط
        if (modalMode === 'create') {
          await comprehensiveActivityService.recordComprehensiveActivity({
            action: 'line_create',
            description: `إنشاء خط جديد: ${formData.name}`,
            entity_type: 'line',
            success: true
          });
        }
      }
    } catch (error) {
      console.error('خطأ في حفظ الخط:', error);
    }
  };

  const handleAreaSubmit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const url = modalMode === 'create' 
        ? `${API_URL}/api/enhanced-lines-areas/areas`
        : `${API_URL}/api/enhanced-lines-areas/areas/${selectedArea.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          line_id: formData.line_id,
          manager_id: formData.manager_id || null,
          is_active: formData.is_active
        })
      });

      if (response.ok) {
        await loadLinesAreasData();
        setShowAreaModal(false);
        resetForm();
        
        // تسجيل النشاط
        if (modalMode === 'create') {
          await comprehensiveActivityService.recordComprehensiveActivity({
            action: 'area_create',
            description: `إنشاء منطقة جديدة: ${formData.name}`,
            entity_type: 'area',
            success: true
          });
        }
      }
    } catch (error) {
      console.error('خطأ في حفظ المنطقة:', error);
    }
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${type === 'line' ? 'الخط' : 'المنطقة'}: ${name}؟`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = type === 'line' 
        ? `${API_URL}/api/enhanced-lines-areas/lines/${id}`
        : `${API_URL}/api/enhanced-lines-areas/areas/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadLinesAreasData();
      }
    } catch (error) {
      console.error('خطأ في الحذف:', error);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  return (
    <div className="enhanced-lines-areas-management min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">🗺️</span>
                إدارة الخطوط والمناطق المحسنة
              </h1>
              <p className="text-teal-100 text-lg">
                نظام متطور لإدارة التقسيم الجغرافي مع التحديث الفوري والإحصائيات الشاملة
              </p>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={loadLinesAreasData}
                disabled={loading}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? '⏳' : '🔄'} تحديث البيانات
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">إجمالي الخطوط</p>
                <p className="text-3xl font-bold">{formatNumber(statistics.lines?.total)}</p>
              </div>
              <div className="text-4xl">🛤️</div>
            </div>
            <div className="text-blue-100 text-sm mt-2">
              مع مدير: {formatNumber(statistics.lines?.with_manager)} | بدون: {formatNumber(statistics.lines?.without_manager)}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">إجمالي المناطق</p>
                <p className="text-3xl font-bold">{formatNumber(statistics.areas?.total)}</p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
            <div className="text-green-100 text-sm mt-2">
              مع مدير: {formatNumber(statistics.areas?.with_manager)} | بدون: {formatNumber(statistics.areas?.without_manager)}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">العيادات المربوطة</p>
                <p className="text-3xl font-bold">
                  {formatNumber(lines.reduce((sum, line) => sum + (line.clinics_count || 0), 0))}
                </p>
              </div>
              <div className="text-4xl">🏥</div>
            </div>
            <div className="text-purple-100 text-sm mt-2">موزعة على الخطوط والمناطق</div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">المناديب النشطون</p>
                <p className="text-3xl font-bold">
                  {formatNumber(lines.reduce((sum, line) => sum + (line.reps_count || 0), 0))}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <div className="text-orange-100 text-sm mt-2">موزعون على الخطوط</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('lines')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'lines' 
                  ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">🛤️</span>
              إدارة الخطوط ({formatNumber(lines.length)})
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'areas' 
                  ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">📍</span>
              إدارة المناطق ({formatNumber(areas.length)})
            </button>
          </div>
        </div>

        {/* Lines Tab */}
        {activeTab === 'lines' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">إدارة الخطوط</h2>
              <button
                onClick={() => openLineModal('create')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                ➕ إضافة خط جديد
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <p className="text-gray-600 text-xl">جاري تحميل الخطوط...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lines.map((line) => (
                  <div key={line.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">🛤️</div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          line.is_active ? 'bg-green-100 bg-opacity-20 text-white' : 'bg-red-100 bg-opacity-20 text-white'
                        }`}>
                          {line.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{line.name}</h3>
                      <p className="text-blue-100 text-sm">كود: {line.code}</p>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">الإحصائيات</h4>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{line.areas_count || 0}</div>
                              <div className="text-gray-600">مناطق</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{line.clinics_count || 0}</div>
                              <div className="text-gray-600">عيادات</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{line.reps_count || 0}</div>
                              <div className="text-gray-600">مناديب</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">معلومات إضافية</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>المدير:</strong> {line.manager_name || 'غير محدد'}
                            </div>
                            <div>
                              <strong>الوصف:</strong> {line.description || 'لا يوجد وصف'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex space-x-3 space-x-reverse">
                        <button
                          onClick={() => openLineModal('edit', line)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDelete('line', line.id, line.name)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">إدارة المناطق</h2>
              <button
                onClick={() => openAreaModal('create')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
              >
                ➕ إضافة منطقة جديدة
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <p className="text-gray-600 text-xl">جاري تحميل المناطق...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area) => (
                  <div key={area.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">📍</div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          area.is_active ? 'bg-green-100 bg-opacity-20 text-white' : 'bg-red-100 bg-opacity-20 text-white'
                        }`}>
                          {area.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{area.name}</h3>
                      <p className="text-green-100 text-sm">كود: {area.code}</p>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">معلومات الخط</h4>
                          <div className="text-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">الخط:</span>
                              <span className="font-medium text-blue-600">{area.line_name || 'غير محدد'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">العيادات:</span>
                              <span className="font-bold text-green-600">{area.clinics_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">معلومات إضافية</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>المدير:</strong> {area.manager_name || 'غير محدد'}
                            </div>
                            <div>
                              <strong>الوصف:</strong> {area.description || 'لا يوجد وصف'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex space-x-3 space-x-reverse">
                        <button
                          onClick={() => openAreaModal('edit', area)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDelete('area', area.id, area.name)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Line Modal */}
      {showLineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {modalMode === 'create' ? 'إضافة خط جديد' : 'تعديل الخط'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم الخط *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل اسم الخط"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كود الخط *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: CAI"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدير الخط</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر مدير الخط</option>
                  {users.filter(u => u.role === 'line_manager' || u.role === 'admin').map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف الخط (اختياري)"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">الخط نشط</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 space-x-reverse">
              <button
                onClick={() => setShowLineModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleLineSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                {modalMode === 'create' ? 'إضافة' : 'تحديث'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {modalMode === 'create' ? 'إضافة منطقة جديدة' : 'تعديل المنطقة'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنطقة *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="أدخل اسم المنطقة"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كود المنطقة *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="مثال: NS"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخط التابع له *</label>
                <select
                  value={formData.line_id}
                  onChange={(e) => setFormData({...formData, line_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر الخط</option>
                  {lines.filter(line => line.is_active).map(line => (
                    <option key={line.id} value={line.id}>{line.name} ({line.code})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدير المنطقة</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر مدير المنطقة</option>
                  {users.filter(u => u.role === 'area_manager' || u.role === 'line_manager' || u.role === 'admin').map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="وصف المنطقة (اختياري)"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">المنطقة نشطة</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 space-x-reverse">
              <button
                onClick={() => setShowAreaModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleAreaSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                {modalMode === 'create' ? 'إضافة' : 'تحديث'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLinesAreasManagement;