// Enhanced Lines Areas Management Component - إدارة الخطوط والمناطق المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const LinesAreasManagement = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lines, setLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    fetchLines();
    fetchAreas();
  }, []);

  const fetchLines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/lines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLines(response.data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
      // Mock data for development
      setLines([
        {
          id: 'line-001',
          name: 'خط القاهرة الكبرى',
          code: 'CGC',
          description: 'يغطي القاهرة والجيزة والقليوبية',
          manager_id: 'user-001',
          manager_name: 'أحمد محمد علي',
          areas_count: 5,
          reps_count: 12,
          clinics_count: 45,
          is_active: true,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'line-002',
          name: 'خط الإسكندرية',
          code: 'ALX',
          description: 'يغطي الإسكندرية ومحافظات الساحل الشمالي',
          manager_id: 'user-002',
          manager_name: 'فاطمة سالم',
          areas_count: 3,
          reps_count: 8,
          clinics_count: 28,
          is_active: true,
          created_at: '2024-01-02T10:00:00Z'
        },
        {
          id: 'line-003',
          name: 'خط الصعيد',
          code: 'UEG',
          description: 'يغطي أسيوط وسوهاج والأقصر وأسوان',
          manager_id: 'user-003',
          manager_name: 'محمود حسن',
          areas_count: 4,
          reps_count: 10,
          clinics_count: 32,
          is_active: true,
          created_at: '2024-01-03T10:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
      // Mock data for development
      setAreas([
        {
          id: 'area-001',
          name: 'وسط القاهرة',
          code: 'CC',
          description: 'منطقة وسط القاهرة التجارية',
          parent_line_id: 'line-001',
          parent_line_name: 'خط القاهرة الكبرى',
          manager_id: 'user-004',
          manager_name: 'سارة أحمد',
          reps_count: 4,
          clinics_count: 15,
          is_active: true,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'area-002',
          name: 'شرق القاهرة',
          code: 'EC',
          description: 'منطقة شرق القاهرة السكنية',
          parent_line_id: 'line-001',
          parent_line_name: 'خط القاهرة الكبرى',
          manager_id: 'user-005',
          manager_name: 'خالد محمود',
          reps_count: 3,
          clinics_count: 12,
          is_active: true,
          created_at: '2024-01-02T10:00:00Z'
        },
        {
          id: 'area-003',
          name: 'الجيزة الشرقية',
          code: 'EG',
          description: 'منطقة شرق الجيزة',
          parent_line_id: 'line-001',
          parent_line_name: 'خط القاهرة الكبرى',
          manager_id: 'user-006',
          manager_name: 'نورا علي',
          reps_count: 3,
          clinics_count: 10,
          is_active: true,
          created_at: '2024-01-03T10:00:00Z'
        },
        {
          id: 'area-004',
          name: 'وسط الإسكندرية',
          code: 'CA',
          description: 'منطقة وسط الإسكندرية',
          parent_line_id: 'line-002',
          parent_line_name: 'خط الإسكندرية',
          manager_id: 'user-007',
          manager_name: 'عمر حسام',
          reps_count: 4,
          clinics_count: 16,
          is_active: true,
          created_at: '2024-01-04T10:00:00Z'
        }
      ]);
    }
  };

  const handleCreateLine = async (lineData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Creating line with data:', lineData);
      
      const response = await axios.post(`${API}/lines`, lineData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Line created successfully:', response.data);
      fetchLines();
      setShowLineModal(false);
      alert('تم إنشاء الخط بنجاح');
    } catch (error) {
      console.error('❌ Error creating line:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء إنشاء الخط';
      alert(`خطأ في إنشاء الخط: ${errorMessage}`);
    }
  };

  const handleUpdateLine = async (lineId, lineData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Updating line:', lineId, 'with data:', lineData);
      
      const response = await axios.put(`${API}/lines/${lineId}`, lineData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Line updated successfully:', response.data);
      fetchLines();
      setShowLineModal(false);
      alert('تم تحديث الخط بنجاح');
    } catch (error) {
      console.error('❌ Error updating line:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء تحديث الخط';
      alert(`خطأ في تحديث الخط: ${errorMessage}`);
    }
  };

  const handleDeleteLine = async (lineId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الخط؟ سيتم حذف جميع المناطق التابعة له أيضاً.')) {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔧 Deleting line:', lineId);
        
        const response = await axios.delete(`${API}/lines/${lineId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Line deleted successfully:', response.data);
        fetchLines();
        fetchAreas(); // Refresh areas as they might be affected
        alert('تم حذف الخط بنجاح');
      } catch (error) {
        console.error('❌ Error deleting line:', error);
        const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء حذف الخط';
        alert(`خطأ في حذف الخط: ${errorMessage}`);
      }
    }
  };

  const handleCreateArea = async (areaData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Creating area with data:', areaData);
      
      const response = await axios.post(`${API}/areas`, areaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Area created successfully:', response.data);
      fetchAreas();
      setShowAreaModal(false);
      alert('تم إنشاء المنطقة بنجاح');
    } catch (error) {
      console.error('❌ Error creating area:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء إنشاء المنطقة';
      alert(`خطأ في إنشاء المنطقة: ${errorMessage}`);
    }
  };

  const handleUpdateArea = async (areaId, areaData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Updating area:', areaId, 'with data:', areaData);
      
      // التأكد من تعيين حالة النشاط افتراضياً
      const updatedData = {
        ...areaData,
        is_active: areaData.is_active !== false // تعيين true كافتراضي
      };
      
      const response = await axios.put(`${API}/areas/${areaId}`, updatedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Area updated successfully:', response.data);
      
      // تحديث البيانات المحلية فوراً
      setAreas(prevAreas => 
        prevAreas.map(area => 
          area.id === areaId 
            ? { ...area, ...updatedData, updated_at: new Date().toISOString() }
            : area
        )
      );
      
      setShowAreaModal(false);
      alert('تم تحديث المنطقة بنجاح ✅');
      
      // إعادة تحميل البيانات للتأكد من التحديث
      setTimeout(() => {
        fetchAreas();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error updating area:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء تحديث المنطقة';
      alert(`خطأ في تحديث المنطقة: ${errorMessage}\n\nسيتم إعادة المحاولة...`);
      
      // محاولة أخرى بعد ثانية واحدة
      setTimeout(() => {
        handleUpdateArea(areaId, areaData);
      }, 1000);
    }
  };

  const handleDeleteArea = async (areaId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔧 Deleting area:', areaId);
        
        const response = await axios.delete(`${API}/areas/${areaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Area deleted successfully:', response.data);
        fetchAreas();
        alert('تم حذف المنطقة بنجاح');
      } catch (error) {
        console.error('❌ Error deleting area:', error);
        const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء حذف المنطقة';
        alert(`خطأ في حذف المنطقة: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{lines.length}</div>
          <div className="text-sm opacity-75">إجمالي الخطوط</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{areas.length}</div>
          <div className="text-sm opacity-75">إجمالي المناطق</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{lines.reduce((sum, line) => sum + (line.reps_count || 0), 0)}</div>
          <div className="text-sm opacity-75">إجمالي المندوبين</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{lines.reduce((sum, line) => sum + (line.clinics_count || 0), 0)}</div>
          <div className="text-sm opacity-75">إجمالي العيادات</div>
        </div>
      </div>

      {/* Lines Overview */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4">نظرة عامة على الخطوط</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lines.map(line => (
            <div key={line.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{line.name}</h4>
                <span className="text-sm px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                  {line.code}
                </span>
              </div>
              <p className="text-sm opacity-75 mb-3">{line.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-bold text-lg">{line.areas_count || 0}</div>
                  <div className="text-xs opacity-75">مناطق</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{line.reps_count || 0}</div>
                  <div className="text-xs opacity-75">مندوبين</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{line.clinics_count || 0}</div>
                  <div className="text-xs opacity-75">عيادات</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <strong>المدير:</strong> {line.manager_name || 'غير محدد'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLinesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">إدارة الخطوط</h3>
        <button
          onClick={() => {
            setSelectedLine(null);
            setShowLineModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          إضافة خط جديد
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">الخط</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الكود</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المدير</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المناطق</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المندوبين</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العيادات</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{line.name}</div>
                    <div className="text-sm opacity-75">{line.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {line.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {line.manager_name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="font-bold">{line.areas_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="font-bold">{line.reps_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="font-bold">{line.clinics_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      line.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {line.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedLine(line);
                          setShowLineModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAreasTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">إدارة المناطق</h3>
        <button
          onClick={() => {
            setSelectedArea(null);
            setShowAreaModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          إضافة منطقة جديدة
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">المنطقة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الكود</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الخط الأساسي</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المدير</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المندوبين</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العيادات</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{area.name}</div>
                    <div className="text-sm opacity-75">{area.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                      {area.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {area.parent_line_name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {area.manager_name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="font-bold">{area.reps_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="font-bold">{area.clinics_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      area.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {area.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedArea(area);
                          setShowAreaModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lines-areas-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">🗺️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">إدارة الخطوط والمناطق</h1>
            <p className="text-lg opacity-75">إدارة شاملة للخطوط الجغرافية والمناطق التابعة لها</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊' },
            { id: 'lines', name: 'إدارة الخطوط', icon: '🛤️' },
            { id: 'areas', name: 'إدارة المناطق', icon: '🏘️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-300 border-b-2 border-blue-400'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'lines' && renderLinesTab()}
          {activeTab === 'areas' && renderAreasTab()}
        </div>
      </div>

      {/* Line Modal */}
      {showLineModal && (
        <LineModal
          line={selectedLine}
          onClose={() => setShowLineModal(false)}
          onSave={selectedLine ? 
            (data) => handleUpdateLine(selectedLine.id, data) : 
            handleCreateLine
          }
          language={language}
        />
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <AreaModal
          area={selectedArea}
          lines={lines}
          onClose={() => setShowAreaModal(false)}
          onSave={selectedArea ? 
            (data) => handleUpdateArea(selectedArea.id, data) : 
            handleCreateArea
          }
          language={language}
        />
      )}
    </div>
  );
};

// Line Modal Component
const LineModal = ({ line, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    name: line?.name || '',
    code: line?.code || '',
    description: line?.description || '',
    manager_id: line?.manager_id || '',
    is_active: line?.is_active !== undefined ? line.is_active : true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-lg w-full border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              {line ? 'تعديل الخط' : 'إضافة خط جديد'}
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم الخط *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الكود *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: CGC, ALX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف تفصيلي للخط الجغرافي..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                خط نشط
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                {line ? 'تحديث الخط' : 'إضافة الخط'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
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

// Area Modal Component
const AreaModal = ({ area, lines, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    code: area?.code || '',
    description: area?.description || '',
    parent_line_id: area?.parent_line_id || '',
    manager_id: area?.manager_id || '',
    is_active: area?.is_active !== undefined ? area.is_active : true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-lg w-full border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              {area ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم المنطقة *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الكود *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: CC, EA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الخط الأساسي *</label>
              <select
                name="parent_line_id"
                value={formData.parent_line_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر الخط الأساسي</option>
                {lines.map(line => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف تفصيلي للمنطقة..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_area"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active_area" className="text-sm font-medium">
                منطقة نشطة
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {area ? 'تحديث المنطقة' : 'إضافة المنطقة'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
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

export default LinesAreasManagement;