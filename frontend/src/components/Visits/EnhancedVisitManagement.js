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

  // Enhanced Export to PDF with better formatting
  const exportToPDF = async (data, filename, title) => {
    try {
      setExportLoading(true);
      
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Add Arabic font support (simplified approach)
      pdf.setFont("times", "normal");
      
      // Header
      pdf.setFillColor(99, 102, 241); // Indigo color
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Title
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, 20, 20);
      
      // Date and time
      pdf.setFontSize(10);
      pdf.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`, 20, 25);
      
      // Summary statistics
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.text(`إجمالي السجلات: ${data.length}`, pageWidth - 80, 45);
      
      // Table headers
      let yPosition = 60;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont("times", "bold");
      
      if (activeTab === 'visits') {
        pdf.text('ID', 20, yPosition);
        pdf.text('Clinic', 40, yPosition);
        pdf.text('Representative', 100, yPosition);
        pdf.text('Date', 150, yPosition);
        pdf.text('Status', 190, yPosition);
        pdf.text('Duration', 220, yPosition);
        pdf.text('Notes', 250, yPosition);
      } else {
        pdf.text('ID', 20, yPosition);
        pdf.text('User', 40, yPosition);
        pdf.text('Role', 90, yPosition);
        pdf.text('Login Time', 130, yPosition);
        pdf.text('IP Address', 170, yPosition);
        pdf.text('Device', 210, yPosition);
        pdf.text('Status', 250, yPosition);
      }
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      // Table data
      data.slice(0, 50).forEach((item, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(249, 249, 249);
          pdf.rect(15, yPosition - 3, pageWidth - 30, 6, 'F');
        }
        
        pdf.setFontSize(8);
        
        if (activeTab === 'visits') {
          pdf.text((item.id || '').toString().substring(0, 8), 20, yPosition);
          pdf.text((item.clinic_name || 'N/A').substring(0, 15), 40, yPosition);
          pdf.text((item.sales_rep_name || 'N/A').substring(0, 12), 100, yPosition);
          pdf.text(formatDate(item.visit_date).substring(0, 10), 150, yPosition);
          pdf.text((item.status || 'N/A').substring(0, 8), 190, yPosition);
          pdf.text(formatDuration(item.duration).substring(0, 8), 220, yPosition);
          pdf.text((item.notes || 'N/A').substring(0, 10), 250, yPosition);
        } else {
          pdf.text((item.id || '').toString().substring(0, 8), 20, yPosition);
          pdf.text((item.user_name || 'N/A').substring(0, 12), 40, yPosition);
          pdf.text((item.user_role || 'N/A').substring(0, 10), 90, yPosition);
          pdf.text(formatDate(item.login_time).substring(0, 12), 130, yPosition);
          pdf.text((item.ip_address || 'N/A').substring(0, 12), 170, yPosition);
          pdf.text((item.device || 'N/A').substring(0, 10), 210, yPosition);
          pdf.text((item.status || 'N/A').substring(0, 8), 250, yPosition);
        }
        
        yPosition += 6;
      });
      
      // Footer
      const totalPages = Math.ceil((data.length / 50));
      pdf.setFontSize(8);
      pdf.text(`الصفحة 1 من ${totalPages} - النظام الطبي المتكامل`, pageWidth - 60, pageHeight - 10);
      
      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('✅ Enhanced PDF exported successfully');
      
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      setExportLoading(false);
    }
  };

  // Export Analytics Report
  const exportAnalyticsReport = () => {
    try {
      setExportLoading(true);
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      
      // Header
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`تقرير التحليلات - ${activeTab === 'visits' ? 'الزيارات' : 'سجل الدخول'}`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 20, 30);
      
      let yPosition = 50;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      
      if (activeTab === 'visits') {
        // Visits Analytics
        const completedCount = visits.filter(v => v.status === 'completed').length;
        const uniqueClinics = new Set(visits.map(v => v.clinic_id)).size;
        const uniqueReps = new Set(visits.map(v => v.user_id)).size;
        
        pdf.text('📊 إحصائيات الزيارات الشاملة', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.text(`• إجمالي الزيارات: ${visits.length}`, 30, yPosition); yPosition += 8;
        pdf.text(`• الزيارات المكتملة: ${completedCount} (${Math.round((completedCount/visits.length)*100)}%)`, 30, yPosition); yPosition += 8;
        pdf.text(`• العيادات المختلفة: ${uniqueClinics}`, 30, yPosition); yPosition += 8;
        pdf.text(`• المندوبين النشطين: ${uniqueReps}`, 30, yPosition); yPosition += 15;
        
        // Top performers
        const repStats = Object.entries(
          visits.reduce((acc, visit) => {
            const rep = visit.sales_rep_name || 'غير محدد';
            acc[rep] = (acc[rep] || 0) + 1;
            return acc;
          }, {})
        ).sort(([,a], [,b]) => b - a).slice(0, 5);
        
        pdf.setFontSize(14);
        pdf.text('🏆 أفضل 5 مندوبين', 20, yPosition); yPosition += 10;
        pdf.setFontSize(12);
        repStats.forEach(([rep, count], index) => {
          pdf.text(`${index + 1}. ${rep}: ${count} زيارة`, 30, yPosition);
          yPosition += 8;
        });
        
      } else {
        // Login Analytics
        const successfulCount = loginLogs.filter(l => l.status === 'successful').length;
        const uniqueUsers = new Set(loginLogs.map(l => l.user_id)).size;
        const avgDuration = loginLogs.length > 0 ? 
          loginLogs.reduce((acc, l) => acc + (l.session_duration || 0), 0) / loginLogs.length : 0;
        
        pdf.text('🔐 إحصائيات تسجيل الدخول الشاملة', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.text(`• إجمالي جلسات الدخول: ${loginLogs.length}`, 30, yPosition); yPosition += 8;
        pdf.text(`• جلسات ناجحة: ${successfulCount} (${Math.round((successfulCount/loginLogs.length)*100)}%)`, 30, yPosition); yPosition += 8;
        pdf.text(`• مستخدمين فريدين: ${uniqueUsers}`, 30, yPosition); yPosition += 8;
        pdf.text(`• متوسط مدة الجلسة: ${Math.round(avgDuration/60)} دقيقة`, 30, yPosition); yPosition += 15;
        
        // Top users
        const userStats = Object.entries(
          loginLogs.reduce((acc, log) => {
            const user = log.user_name || 'غير محدد';
            acc[user] = (acc[user] || 0) + 1;
            return acc;
          }, {})
        ).sort(([,a], [,b]) => b - a).slice(0, 5);
        
        pdf.setFontSize(14);
        pdf.text('👥 أكثر 5 مستخدمين نشاطاً', 20, yPosition); yPosition += 10;
        pdf.setFontSize(12);
        userStats.forEach(([user, count], index) => {
          pdf.text(`${index + 1}. ${user}: ${count} جلسة`, 30, yPosition);
          yPosition += 8;
        });
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.text(`تم إنشاء التقرير بواسطة النظام الطبي المتكامل - ${new Date().toLocaleString('ar-EG')}`, 
        pageWidth - 120, pdf.internal.pageSize.height - 10);
      
      const reportTitle = activeTab === 'visits' ? 'visits-analytics' : 'login-analytics';
      pdf.save(`${reportTitle}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('✅ Analytics report exported successfully');
      
    } catch (error) {
      console.error('❌ Error exporting analytics report:', error);
      alert('حدث خطأ أثناء تصدير تقرير التحليلات');
    } finally {
      setExportLoading(false);
    }
  };

  // Enhanced Export to Excel with better formatting
  const exportToExcel = (data, filename, sheetName) => {
    try {
      setExportLoading(true);
      
      // Prepare data for Excel with better formatting
      const excelData = data.map(item => {
        if (activeTab === 'visits') {
          return {
            'معرف الزيارة': item.id || '',
            'اسم العيادة': item.clinic_name || '',
            'المندوب الطبي': item.sales_rep_name || '',
            'تاريخ الزيارة': formatDate(item.visit_date),
            'الحالة': item.status === 'completed' ? 'مكتملة' : 
                     item.status === 'pending' ? 'معلقة' : 
                     item.status === 'cancelled' ? 'ملغية' : item.status,
            'المدة (دقيقة)': item.duration ? Math.round(item.duration / 60) : '',
            'الملاحظات': item.notes || '',
            'عنوان العيادة': item.clinic_address || '',
            'رقم الهاتف': item.clinic_phone || '',
            'نوع الزيارة': item.visit_type || 'زيارة عادية'
          };
        } else {
          return {
            'معرف الجلسة': item.id || '',
            'اسم المستخدم': item.user_name || '',
            'الدور': item.user_role || '',
            'وقت تسجيل الدخول': formatDate(item.login_time),
            'وقت تسجيل الخروج': formatDate(item.logout_time),
            'مدة الجلسة': formatDuration(item.session_duration),
            'عنوان IP': item.ip_address || '',
            'نوع الجهاز': item.device || '',
            'الموقع': item.location || '',
            'الحالة': item.status === 'successful' ? 'نجح' : 
                     item.status === 'failed' ? 'فشل' : 
                     item.status === 'active' ? 'نشط' : item.status
          };
        }
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = activeTab === 'visits' 
        ? [15, 25, 20, 15, 10, 10, 30, 25, 15, 15]
        : [15, 20, 15, 20, 20, 15, 15, 15, 20, 10];
        
      worksheet['!cols'] = colWidths.map(width => ({ width }));
      
      // Add title row
      XLSX.utils.sheet_add_aoa(worksheet, [[
        `تقرير ${activeTab === 'visits' ? 'الزيارات' : 'سجل الدخول'}`,
        '',
        '',
        `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`,
        '',
        '',
        `إجمالي السجلات: ${data.length}`,
        '',
        '',
        ''
      ]], { origin: -1 });
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('✅ Enhanced Excel exported successfully');
      
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
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Advanced Export Options */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <span className="text-sm text-gray-600 font-medium">📊 تصدير:</span>
              
              <button
                onClick={() => {
                  const data = activeTab === 'visits' ? filteredVisits : filteredLoginLogs;
                  const title = activeTab === 'visits' ? 'تقرير الزيارات المفصل' : 'تقرير سجل الدخول المفصل';
                  const filename = activeTab === 'visits' ? 'detailed-visits-report' : 'detailed-login-logs-report';
                  exportToPDF(data, filename, title);
                }}
                disabled={exportLoading}
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                📄 PDF
              </button>
              
              <button
                onClick={() => {
                  const data = activeTab === 'visits' ? filteredVisits : filteredLoginLogs;
                  const filename = activeTab === 'visits' ? 'visits-data' : 'login-logs-data';
                  const sheetName = activeTab === 'visits' ? 'الزيارات' : 'سجل الدخول';
                  exportToExcel(data, filename, sheetName);
                }}
                disabled={exportLoading}
                className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                📊 Excel
              </button>
              
              <button
                onClick={() => exportAnalyticsReport()}
                disabled={exportLoading}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                📈 تحليلات
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <span className="text-sm text-gray-600 font-medium">⚡ إجراءات:</span>
              
              <button
                onClick={() => {
                  loadVisitsData();
                  loadLoginLogs();
                }}
                disabled={loading}
                className="bg-purple-500 text-white px-3 py-1.5 rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                تحديث
              </button>
              
              <button
                onClick={() => setFilters({ dateFrom: '', dateTo: '', user: '', status: 'all', search: '' })}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                🧹 مسح الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Section */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {activeTab === 'visits' ? (
            <>
              {/* Total Visits */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">إجمالي الزيارات</p>
                    <p className="text-3xl font-bold">{visits.length}</p>
                    <p className="text-blue-100 text-xs">المفلترة: {filteredVisits.length}</p>
                  </div>
                  <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">🚗</span>
                  </div>
                </div>
              </div>

              {/* Completed Visits */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">زيارات مكتملة</p>
                    <p className="text-3xl font-bold">
                      {visits.filter(v => v.status === 'completed').length}
                    </p>
                    <p className="text-green-100 text-xs">
                      {visits.length > 0 ? Math.round((visits.filter(v => v.status === 'completed').length / visits.length) * 100) : 0}% من الإجمالي
                    </p>
                  </div>
                  <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              {/* Unique Clinics */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">عيادات مختلفة</p>
                    <p className="text-3xl font-bold">
                      {new Set(visits.map(v => v.clinic_id)).size}
                    </p>
                    <p className="text-purple-100 text-xs">عيادات فريدة</p>
                  </div>
                  <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">🏥</span>
                  </div>
                </div>
              </div>

              {/* Active Representatives */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">مندوبين نشطين</p>
                    <p className="text-3xl font-bold">
                      {new Set(visits.map(v => v.user_id)).size}
                    </p>
                    <p className="text-orange-100 text-xs">مندوب فريد</p>
                  </div>
                  <div className="p-3 bg-orange-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Total Login Sessions */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">جلسات الدخول</p>
                    <p className="text-3xl font-bold">{loginLogs.length}</p>
                    <p className="text-indigo-100 text-xs">المفلترة: {filteredLoginLogs.length}</p>
                  </div>
                  <div className="p-3 bg-indigo-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">🔐</span>
                  </div>
                </div>
              </div>

              {/* Successful Logins */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">دخول ناجح</p>
                    <p className="text-3xl font-bold">
                      {loginLogs.filter(l => l.status === 'successful').length}
                    </p>
                    <p className="text-green-100 text-xs">
                      {loginLogs.length > 0 ? Math.round((loginLogs.filter(l => l.status === 'successful').length / loginLogs.length) * 100) : 0}% نجح
                    </p>
                  </div>
                  <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              {/* Unique Users */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">مستخدمين فريدين</p>
                    <p className="text-3xl font-bold">
                      {new Set(loginLogs.map(l => l.user_id)).size}
                    </p>
                    <p className="text-blue-100 text-xs">مستخدم مختلف</p>
                  </div>
                  <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              {/* Average Session Duration */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">متوسط مدة الجلسة</p>
                    <p className="text-3xl font-bold">
                      {loginLogs.length > 0 
                        ? Math.round(loginLogs.reduce((acc, l) => acc + (l.session_duration || 0), 0) / loginLogs.length / 60)
                        : 0}
                    </p>
                    <p className="text-teal-100 text-xs">دقيقة في المتوسط</p>
                  </div>
                  <div className="p-3 bg-teal-400 bg-opacity-30 rounded-full">
                    <span className="text-2xl">⏱️</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Advanced Analytics Charts Section */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            التحليلات التفصيلية
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">
                {activeTab === 'visits' ? 'توزيع حالات الزيارات' : 'توزيع حالات تسجيل الدخول'}
              </h4>
              <div className="space-y-2">
                {activeTab === 'visits' ? (
                  ['completed', 'pending', 'cancelled'].map(status => {
                    const count = visits.filter(v => v.status === status).length;
                    const percentage = visits.length > 0 ? (count / visits.length) * 100 : 0;
                    const statusText = status === 'completed' ? 'مكتملة' : 
                                     status === 'pending' ? 'معلقة' : 'ملغية';
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{statusText}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                status === 'completed' ? 'bg-green-500' :
                                status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  ['successful', 'failed'].map(status => {
                    const count = loginLogs.filter(l => l.status === status).length;
                    const percentage = loginLogs.length > 0 ? (count / loginLogs.length) * 100 : 0;
                    const statusText = status === 'successful' ? 'ناجح' : 'فاشل';
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{statusText}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                status === 'successful' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">
                {activeTab === 'visits' ? 'أكثر المندوبين نشاطاً' : 'أكثر المستخدمين تسجيل دخول'}
              </h4>
              <div className="space-y-3">
                {activeTab === 'visits' ? (
                  Object.entries(
                    visits.reduce((acc, visit) => {
                      const rep = visit.sales_rep_name || 'غير محدد';
                      acc[rep] = (acc[rep] || 0) + 1;
                      return acc;
                    }, {})
                  )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([rep, count], index) => (
                    <div key={rep} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{rep}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{count} زيارة</span>
                    </div>
                  ))
                ) : (
                  Object.entries(
                    loginLogs.reduce((acc, log) => {
                      const user = log.user_name || 'غير محدد';
                      acc[user] = (acc[user] || 0) + 1;
                      return acc;
                    }, {})
                  )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([user, count], index) => (
                    <div key={user} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{user}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{count} جلسة</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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