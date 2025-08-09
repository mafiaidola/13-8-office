import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClinicModificationLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [filters, setFilters] = useState({
    clinic_id: '',
    modifier_id: '',
    modification_type: '',
    from_date: '',
    to_date: '',
    page: 1,
    page_size: 20
  });

  useEffect(() => {
    loadModificationLogs();
  }, [filters]);

  const loadModificationLogs = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${backendUrl}/api/enhanced-clinics/modification-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading modification logs:', error);
      alert('خطأ في تحميل سجلات التعديل');
    } finally {
      setLoading(false);
    }
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const getModificationTypeBadge = (type) => {
    const typeColors = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'approve': 'bg-purple-100 text-purple-800',
      'reject': 'bg-red-100 text-red-800',
      'suspend': 'bg-yellow-100 text-yellow-800',
      'reactivate': 'bg-teal-100 text-teal-800'
    };
    
    const typeLabels = {
      'create': 'إنشاء',
      'update': 'تعديل',
      'approve': 'اعتماد',
      'reject': 'رفض',
      'suspend': 'تعليق',
      'reactivate': 'إعادة تفعيل'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const nextPage = () => {
    if (pagination.has_next) {
      setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const prevPage = () => {
    if (pagination.has_previous) {
      setFilters(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const renderDataComparison = (oldData, newData) => {
    const changes = [];
    
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key] && key !== 'updated_at' && key !== 'audit_trail') {
        changes.push(
          <div key={key} className="mb-3 p-2 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-700 mb-1">{key}:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-red-600 bg-red-50 px-2 py-1 rounded">قديم:</span>
                <span className="mr-2">{String(oldData[key] || 'غير محدد')}</span>
              </div>
              <div>
                <span className="text-green-600 bg-green-50 px-2 py-1 rounded">جديد:</span>
                <span className="mr-2">{String(newData[key] || 'غير محدد')}</span>
              </div>
            </div>
          </div>
        );
      }
    });
    
    return changes.length > 0 ? changes : <p className="text-sm text-gray-500">لا توجد تغييرات مفصلة</p>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          سجلات تعديل العيادات
        </h1>
        <p className="text-gray-600">
          تتبع جميع التعديلات والتغييرات التي تمت على بيانات العيادات
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع التعديل</label>
            <select
              value={filters.modification_type}
              onChange={(e) => handleFilterChange('modification_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              <option value="create">إنشاء</option>
              <option value="update">تعديل</option>
              <option value="approve">اعتماد</option>
              <option value="reject">رفض</option>
              <option value="suspend">تعليق</option>
              <option value="reactivate">إعادة تفعيل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">معرف العيادة</label>
            <input
              type="text"
              value={filters.clinic_id}
              onChange={(e) => handleFilterChange('clinic_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="معرف العيادة..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حجم الصفحة</label>
            <select
              value={filters.page_size}
              onChange={(e) => handleFilterChange('page_size', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                clinic_id: '',
                modifier_id: '',
                modification_type: '',
                from_date: '',
                to_date: '',
                page: 1,
                page_size: 20
              })}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العيادة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع التعديل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المعدل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ملخص التغييرات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التعديل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.clinic_name}</div>
                      <div className="text-sm text-gray-500">{log.clinic_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getModificationTypeBadge(log.modification_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.modifier_name}</div>
                      <div className="text-sm text-gray-500">{log.modifier_role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{log.changes_summary}</div>
                    {log.modification_reason && (
                      <div className="text-sm text-gray-500 mt-1">
                        السبب: {log.modification_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openLogDetails(log)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات تعديل لعرضها
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            عرض {((pagination.current_page - 1) * pagination.page_size) + 1} إلى{' '}
            {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)}{' '}
            من أصل {pagination.total_count} سجل
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={!pagination.has_previous}
              className={`px-4 py-2 text-sm rounded-md ${
                pagination.has_previous
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              السابق
            </button>
            
            <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
              صفحة {pagination.current_page} من {pagination.total_pages}
            </span>
            
            <button
              onClick={nextPage}
              disabled={!pagination.has_next}
              className={`px-4 py-2 text-sm rounded-md ${
                pagination.has_next
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تفاصيل سجل التعديل</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">معلومات أساسية</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>العيادة:</strong> {selectedLog.clinic_name}</p>
                  <p><strong>معرف العيادة:</strong> {selectedLog.clinic_id}</p>
                  <p><strong>نوع التعديل:</strong> {getModificationTypeBadge(selectedLog.modification_type)}</p>
                  <p><strong>ملخص التغييرات:</strong> {selectedLog.changes_summary}</p>
                  <p><strong>تاريخ التعديل:</strong> {formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              {/* Modifier Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">معلومات المعدل</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الاسم:</strong> {selectedLog.modifier_name}</p>
                  <p><strong>الدور:</strong> {selectedLog.modifier_role}</p>
                  {selectedLog.modification_reason && (
                    <p><strong>سبب التعديل:</strong> {selectedLog.modification_reason}</p>
                  )}
                  {selectedLog.admin_notes && (
                    <p><strong>ملاحظات إدارية:</strong> {selectedLog.admin_notes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            {selectedLog.modifier_location && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">موقع المعدل وقت التعديل</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>خط العرض:</strong> {selectedLog.modifier_location.latitude}</p>
                  <p><strong>خط الطول:</strong> {selectedLog.modifier_location.longitude}</p>
                  <p><strong>الوقت:</strong> {formatDate(selectedLog.modifier_location.timestamp)}</p>
                </div>
              </div>
            )}

            {/* Data Changes */}
            {selectedLog.old_data && selectedLog.new_data && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">التغييرات التفصيلية</h3>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-4">
                  {renderDataComparison(selectedLog.old_data, selectedLog.new_data)}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicModificationLogs;