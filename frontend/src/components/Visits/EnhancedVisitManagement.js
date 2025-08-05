// Enhanced Visit and Login Management - إدارة الزيارات وسجل الدخول المحسنة (Admin Only)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const EnhancedVisitManagement = ({ user, language = 'ar', isRTL = true }) => {
  const [activeTab, setActiveTab] = useState('visits');
  const [visits, setVisits] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    user: '',
    status: 'all',
    search: ''
  });
  const [exportLoading, setExportLoading] = useState(false);

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  // Check admin permissions
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadVisitsData();
      loadLoginLogs();
    }
  }, [user, isAdmin]);

  // Load visits data
  const loadVisitsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.user) params.append('user_id', filters.user);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await axios.get(`${API}/visits?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setVisits(Array.isArray(response.data) ? response.data : []);
        console.log('✅ Visits loaded:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  // Load login logs
  const loadLoginLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Mock login logs data for now - يمكن استبدالها بـ API حقيقي
      const mockLoginLogs = [
        {
          id: 'log_001',
          user_name: 'أحمد محمد علي',
          user_role: 'medical_rep',
          login_time: new Date(Date.now() - 2 * 3600000).toISOString(),
          logout_time: new Date(Date.now() - 1 * 3600000).toISOString(),
          ip_address: '192.168.1.100',
          device: 'Mobile - Android',
          location: 'القاهرة، مصر',
          session_duration: 3600,
          status: 'completed'
        },
        {
          id: 'log_002',
          user_name: 'فاطمة أحمد السيد',
          user_role: 'admin',
          login_time: new Date(Date.now() - 4 * 3600000).toISOString(),
          logout_time: null,
          ip_address: '192.168.1.105',
          device: 'Desktop - Windows',
          location: 'الإسكندرية، مصر',
          session_duration: null,
          status: 'active'
        },
        {
          id: 'log_003',
          user_name: 'محمد حسن عبدالله',
          user_role: 'medical_rep',
          login_time: new Date(Date.now() - 6 * 3600000).toISOString(),
          logout_time: new Date(Date.now() - 5.5 * 3600000).toISOString(),
          ip_address: '192.168.1.110',
          device: 'Mobile - iOS',
          location: 'الجيزة، مصر',
          session_duration: 1800,
          status: 'completed'
        }
      ];

      setLoginLogs(mockLoginLogs);
      console.log('✅ Login logs loaded:', mockLoginLogs.length);

    } catch (error) {
      console.error('❌ Error loading login logs:', error);
      setLoginLogs([]);
    }
  };

  // Filter visits based on search
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = !filters.search || 
      visit.clinic_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      visit.sales_rep_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || visit.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  // Filter login logs
  const filteredLoginLogs = loginLogs.filter(log => {
    const matchesSearch = !filters.search || 
      log.user_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.user_role?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  // Handle record details
  const handleShowDetails = (record, type) => {
    setSelectedRecord({ ...record, type });
    setShowDetailsModal(true);
  };

  // Export to PDF
  const exportToPDF = async (data, filename, title) => {
    try {
      setExportLoading(true);
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.text(title, 20, 20);
      
      // Add date
      pdf.setFontSize(12);
      pdf.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`, 20, 30);
      
      // Add data table (simplified for demo)
      let yPosition = 50;
      pdf.setFontSize(10);
      
      data.slice(0, 20).forEach((item, index) => {
        const text = activeTab === 'visits' 
          ? `${index + 1}. ${item.clinic_name || 'غير محدد'} - ${item.sales_rep_name || 'غير محدد'} - ${item.status || 'غير محدد'}`
          : `${index + 1}. ${item.user_name || 'غير محدد'} - ${item.user_role || 'غير محدد'} - ${item.status || 'غير محدد'}`;
        
        pdf.text(text, 20, yPosition);
        yPosition += 10;
        
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      
      pdf.save(`${filename}.pdf`);
      console.log('✅ PDF exported successfully');
      
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      setExportLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = (data, filename, sheetName) => {
    try {
      setExportLoading(true);
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      console.log('✅ Excel exported successfully');
      
    } catch (error) {
      console.error('❌ Error exporting Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    } finally {
      setExportLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleString('ar-EG');
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'غير محدد';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}س ${minutes}د`;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'active': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'successful': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">🚫 وصول محظور</h2>
          <p className="text-red-700">هذا القسم متاح للأدمن فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔍 إدارة الزيارات وسجل الدخول</h1>
            <p className="text-indigo-100">مراقبة شاملة للزيارات وأنشطة المستخدمين - أدمن فقط</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadVisitsData();
                loadLoginLogs();
              }}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'visits', name: 'إدارة الزيارات', icon: '🚗', count: filteredVisits.length },
            { id: 'login_logs', name: 'سجل الدخول', icon: '🔐', count: filteredLoginLogs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">🔍 فلاتر البحث والتصفية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="ابحث بالاسم أو العيادة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتمل</option>
              <option value="pending">معلق</option>
              <option value="active">نشط</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setFilters({ dateFrom: '', dateTo: '', user: '', status: 'all', search: '' })}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            🔄 مسح الفلاتر
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const data = activeTab === 'visits' ? filteredVisits : filteredLoginLogs;
                const title = activeTab === 'visits' ? 'تقرير الزيارات' : 'تقرير سجل الدخول';
                const filename = activeTab === 'visits' ? 'visits-report' : 'login-logs-report';
                exportToPDF(data, filename, title);
              }}
              disabled={exportLoading}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              📄 تصدير PDF
            </button>
            
            <button
              onClick={() => {
                const data = activeTab === 'visits' ? filteredVisits : filteredLoginLogs;
                const filename = activeTab === 'visits' ? 'visits-data' : 'login-logs-data';
                const sheetName = activeTab === 'visits' ? 'الزيارات' : 'سجل الدخول';
                exportToExcel(data, filename, sheetName);
              }}
              disabled={exportLoading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              📊 تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="text-gray-700">جاري تحميل البيانات...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Visits Tab */}
          {activeTab === 'visits' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>🚗</span>
                  إدارة الزيارات
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                    {filteredVisits.length} زيارة
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المندوب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العيادة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVisits.length > 0 ? (
                      filteredVisits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{visit.sales_rep_name || 'غير محدد'}</div>
                            <div className="text-sm text-gray-500">{visit.sales_rep_role || 'مندوب'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{visit.clinic_name || 'غير محدد'}</div>
                            <div className="text-sm text-gray-500">{visit.clinic_location || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(visit.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {visit.status === 'successful' ? 'ناجحة' : 
                               visit.status === 'pending' ? 'معلقة' : 
                               visit.status === 'cancelled' ? 'ملغية' : visit.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visit.duration ? `${visit.duration} دقيقة` : 'غير محدد'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleShowDetails(visit, 'visit')}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              📋 التفاصيل
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          لا توجد زيارات متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Login Logs Tab */}
          {activeTab === 'login_logs' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>🔐</span>
                  سجل الدخول
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                    {filteredLoginLogs.length} جلسة
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دخول</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">خروج</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الجهاز</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLoginLogs.length > 0 ? (
                      filteredLoginLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{log.user_name}</div>
                            <div className="text-sm text-gray-500">{log.user_role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(log.login_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.logout_time ? formatDate(log.logout_time) : 'نشط'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDuration(log.session_duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.device}</div>
                            <div className="text-xs text-gray-500">{log.ip_address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status === 'active' ? 'نشط' : 
                               log.status === 'completed' ? 'مكتمل' : log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleShowDetails(log, 'login')}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              📋 التفاصيل
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          لا توجد سجلات دخول متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {selectedRecord.type === 'visit' ? '🚗 تفاصيل الزيارة' : '🔐 تفاصيل جلسة الدخول'}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {selectedRecord.type === 'visit' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">المندوب</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.sales_rep_name || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">العيادة</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.clinic_name || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">التاريخ والوقت</label>
                      <p className="mt-1 text-gray-900">{formatDate(selectedRecord.date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الحالة</label>
                      <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                        {selectedRecord.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الملاحظات</label>
                    <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded-lg">
                      {selectedRecord.notes || 'لا توجد ملاحظات'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        exportToPDF([selectedRecord], `visit-${selectedRecord.id}`, `تفاصيل الزيارة - ${selectedRecord.clinic_name}`);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      📄 طباعة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">المستخدم</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.user_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الدور</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.user_role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">وقت الدخول</label>
                      <p className="mt-1 text-gray-900">{formatDate(selectedRecord.login_time)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">وقت الخروج</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.logout_time ? formatDate(selectedRecord.logout_time) : 'لا يزال نشط'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">مدة الجلسة</label>
                      <p className="mt-1 text-gray-900">{formatDuration(selectedRecord.session_duration)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الجهاز</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.device}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">عنوان IP</label>
                      <p className="mt-1 text-gray-900 font-mono">{selectedRecord.ip_address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الموقع</label>
                      <p className="mt-1 text-gray-900">{selectedRecord.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        exportToPDF([selectedRecord], `login-${selectedRecord.id}`, `تفاصيل جلسة الدخول - ${selectedRecord.user_name}`);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      📄 طباعة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Loading Overlay */}
      {exportLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span>جاري التصدير...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVisitManagement;