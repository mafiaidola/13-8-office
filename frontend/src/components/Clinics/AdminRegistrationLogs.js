import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminRegistrationLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    line_id: '',
    registrar_id: '',
    from_date: '',
    to_date: '',
    page: 1,
    page_size: 20
  });

  const [approvalData, setApprovalData] = useState({
    approval_notes: '',
    classification: '',
    credit_classification: '',
    approved_location: null
  });

  useEffect(() => {
    loadRegistrationLogs();
  }, [filters]);

  const loadRegistrationLogs = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${backendUrl}/api/enhanced-clinics/admin/registration-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        setStatistics(response.data.statistics);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading registration logs:', error);
      alert('خطأ في تحميل سجلات التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const openApprovalModal = (log) => {
    setSelectedLog(log);
    setApprovalModal(true);
    setApprovalData({
      approval_notes: '',
      classification: 'good',
      credit_classification: 'b',
      approved_location: null
    });
  };

  const approveRegistration = async () => {
    if (!selectedLog) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const response = await axios.post(
        `${backendUrl}/api/enhanced-clinics/admin/approve-registration/${selectedLog.clinic_id}`,
        approvalData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('تم اعتماد العيادة بنجاح');
        setApprovalModal(false);
        setSelectedLog(null);
        loadRegistrationLogs(); // إعادة تحميل القائمة
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('خطأ في اعتماد العيادة');
    }
  };

  const rejectRegistration = async (reason) => {
    if (!selectedLog) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const response = await axios.post(
        `${backendUrl}/api/enhanced-clinics/admin/reject-registration/${selectedLog.clinic_id}`,
        { rejection_reason: reason },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('تم رفض العيادة');
        setApprovalModal(false);
        setSelectedLog(null);
        loadRegistrationLogs();
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('خطأ في رفض العيادة');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      'pending': 'قيد المراجعة',
      'approved': 'معتمد',
      'rejected': 'مرفوض'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getAccuracyBadge = (accuracy) => {
    if (!accuracy) return null;
    
    const accuracyColors = {
      'high': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-red-100 text-red-800'
    };
    
    const accuracyLabels = {
      'high': 'دقة عالية',
      'medium': 'دقة متوسطة',
      'low': 'دقة منخفضة'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${accuracyColors[accuracy]}`}>
        {accuracyLabels[accuracy]}
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
          سجل تسجيل العيادات - لوحة الأدمن
        </h1>
        <p className="text-gray-600">
          مراجعة واعتماد طلبات تسجيل العيادات الجديدة
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">📊</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">إجمالي التسجيلات</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_registrations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⏳</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">قيد المراجعة</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">معتمد</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.approved || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-semibold">❌</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">مرفوض</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
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
                status: '',
                line_id: '',
                registrar_id: '',
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

      {/* Registration Logs Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العيادة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الطبيب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المسجل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموقع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  دقة التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
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
                      <div className="text-sm text-gray-500">{log.clinic_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.doctor_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.registrar_name}</div>
                      <div className="text-sm text-gray-500">{log.registrar_role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{log.line_name}</div>
                      <div className="text-sm text-gray-500">{log.area_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {getAccuracyBadge(log.registration_accuracy)}
                      {log.distance_between_locations_km && (
                        <div className="text-xs text-gray-500 mt-1">
                          {log.distance_between_locations_km} كم
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.review_decision)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openLogDetails(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        عرض التفاصيل
                      </button>
                      {log.review_decision === 'pending' && (
                        <button
                          onClick={() => openApprovalModal(log)}
                          className="text-green-600 hover:text-green-900"
                        >
                          مراجعة
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات لعرضها
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تفاصيل تسجيل العيادة</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* بيانات العيادة */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">بيانات العيادة</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الاسم:</strong> {selectedLog.clinic_name}</p>
                  <p><strong>الهاتف:</strong> {selectedLog.clinic_phone || '-'}</p>
                  <p><strong>العنوان:</strong> {selectedLog.clinic_address}</p>
                  <p><strong>الطبيب:</strong> {selectedLog.doctor_name}</p>
                </div>
              </div>

              {/* بيانات المسجل */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">بيانات المسجل</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الاسم:</strong> {selectedLog.registrar_name}</p>
                  <p><strong>الدور:</strong> {selectedLog.registrar_role}</p>
                  <p><strong>الخط:</strong> {selectedLog.line_name}</p>
                  <p><strong>المنطقة:</strong> {selectedLog.area_name}</p>
                  <p><strong>تاريخ التسجيل:</strong> {formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              {/* موقع العيادة */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">موقع العيادة</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>خط العرض:</strong> {selectedLog.clinic_location?.latitude}</p>
                  <p><strong>خط الطول:</strong> {selectedLog.clinic_location?.longitude}</p>
                  <p><strong>العنوان:</strong> {selectedLog.clinic_location?.address}</p>
                </div>
              </div>

              {/* موقع المسجل */}
              {selectedLog.registrar_location && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">موقع المسجل (مخفي)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>خط العرض:</strong> {selectedLog.registrar_location.rep_latitude}</p>
                    <p><strong>خط الطول:</strong> {selectedLog.registrar_location.rep_longitude}</p>
                    <p><strong>المسافة:</strong> {selectedLog.distance_between_locations_km} كم</p>
                    <p><strong>دقة التسجيل:</strong> {selectedLog.registration_accuracy}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ملاحظات */}
            {selectedLog.registration_notes && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">ملاحظات التسجيل</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedLog.registration_notes}</p>
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

      {/* Approval Modal */}
      {approvalModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">مراجعة تسجيل العيادة</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p><strong>العيادة:</strong> {selectedLog.clinic_name}</p>
              <p><strong>الطبيب:</strong> {selectedLog.doctor_name}</p>
              <p><strong>المسجل:</strong> {selectedLog.registrar_name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تصنيف العيادة
                </label>
                <select
                  value={approvalData.classification}
                  onChange={(e) => setApprovalData(prev => ({...prev, classification: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="excellent">ممتاز</option>
                  <option value="very_good">جيد جداً</option>
                  <option value="good">جيد</option>
                  <option value="average">متوسط</option>
                  <option value="poor">ضعيف</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف الائتماني
                </label>
                <select
                  value={approvalData.credit_classification}
                  onChange={(e) => setApprovalData(prev => ({...prev, credit_classification: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="aaa">AAA - ممتاز جداً</option>
                  <option value="aa">AA - ممتاز</option>
                  <option value="a">A - جيد جداً</option>
                  <option value="bbb">BBB - جيد</option>
                  <option value="bb">BB - مقبول</option>
                  <option value="b">B - ضعيف</option>
                  <option value="ccc">CCC - خطر عالي</option>
                  <option value="default">متعثر</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات الاعتماد
                </label>
                <textarea
                  value={approvalData.approval_notes}
                  onChange={(e) => setApprovalData(prev => ({...prev, approval_notes: e.target.value}))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="أي ملاحظات حول الاعتماد..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              
              <button
                onClick={() => {
                  const reason = prompt('سبب الرفض:');
                  if (reason) rejectRegistration(reason);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                رفض
              </button>
              
              <button
                onClick={approveRegistration}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                اعتماد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationLogs;