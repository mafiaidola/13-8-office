// Comprehensive Debt Collection Management System - نظام إدارة الديون والتحصيل الشامل
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const DebtCollectionManagement = ({ user, language = 'ar', isRTL = true }) => {
  const [activeTab, setActiveTab] = useState('debts');
  const [debts, setDebts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDebtDetails, setShowDebtDetails] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_amount: '',
    payment_method: 'cash',
    notes: ''
  });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    clinic: '',
    rep: '',
    search: ''
  });
  const [debtStats, setDebtStats] = useState({
    total_outstanding: 0,
    total_collected: 0,
    overdue_debts: 0,
    collection_rate: 0
  });

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  // Check permissions
  const canManageDebts = ['admin', 'accounting', 'gm'].includes(user?.role);
  const canViewAllDebts = ['admin', 'accounting', 'gm', 'manager'].includes(user?.role);

  useEffect(() => {
    if (canViewAllDebts) {
      loadDebtsData();
      loadCollectionsData();
      loadInvoicesData();
      calculateDebtStats();
    }
  }, [user, canViewAllDebts, filters]);

  // Load debts data
  const loadDebtsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.clinic) params.append('clinic_id', filters.clinic);

      const response = await axios.get(`${API}/debts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setDebts(response.data);
        console.log('✅ Debts loaded:', response.data.length);
      } else {
        setDebts([]);
      }
    } catch (error) {
      console.error('❌ Error loading debts:', error);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load collections data
  const loadCollectionsData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setCollections(response.data);
        console.log('✅ Collections loaded:', response.data.length);
      } else {
        setCollections([]);
      }
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      setCollections([]);
    }
  };

  // Load invoices data
  const loadInvoicesData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setInvoices(response.data);
        console.log('✅ Invoices loaded:', response.data.length);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      setInvoices([]);
    }
  };

  // Calculate debt statistics
  const calculateDebtStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Get aggregated debt statistics
      const debtsResponse = await axios.get(`${API}/debts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const paymentsResponse = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allDebts = debtsResponse.data || [];
      const allPayments = paymentsResponse.data || [];

      const stats = {
        total_outstanding: allDebts
          .filter(debt => debt.status === 'outstanding')
          .reduce((sum, debt) => sum + (debt.remaining_amount || 0), 0),
        
        total_collected: allPayments
          .reduce((sum, payment) => sum + (payment.payment_amount || 0), 0),
        
        overdue_debts: allDebts
          .filter(debt => {
            if (debt.status !== 'outstanding' || !debt.due_date) return false;
            const dueDate = new Date(debt.due_date);
            return dueDate < new Date();
          }).length,
          
        collection_rate: 0
      };

      const totalDebtAmount = allDebts.reduce((sum, debt) => sum + (debt.original_amount || 0), 0);
      stats.collection_rate = totalDebtAmount > 0 ? (stats.total_collected / totalDebtAmount) * 100 : 0;

      setDebtStats(stats);
      console.log('✅ Debt statistics calculated:', stats);

    } catch (error) {
      console.error('❌ Error calculating debt stats:', error);
    }
  };

  // Filter debts based on search and filters
  const filteredDebts = debts.filter(debt => {
    const matchesSearch = !filters.search || 
      debt.clinic_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      debt.invoice_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
      debt.created_by_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || debt.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  // Filter collections
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = !filters.search || 
      collection.processed_by_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      collection.debt_id?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  // Handle payment processing
  const handleProcessPayment = async () => {
    if (!selectedDebt || !paymentForm.payment_amount) {
      alert('يرجى إدخال مبلغ الدفع');
      return;
    }

    const paymentAmount = parseFloat(paymentForm.payment_amount);
    if (paymentAmount <= 0 || paymentAmount > (selectedDebt.remaining_amount || 0)) {
      alert('مبلغ الدفع غير صحيح');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      const paymentData = {
        debt_id: selectedDebt.id,
        payment_amount: paymentAmount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      };

      const response = await axios.post(`${API}/payments/process`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('✅ تم معالجة الدفع بنجاح');
        setShowPaymentModal(false);
        setPaymentForm({ payment_amount: '', payment_method: 'cash', notes: '' });
        setSelectedDebt(null);
        
        // Reload data
        loadDebtsData();
        loadCollectionsData();
        calculateDebtStats();
      } else {
        throw new Error(response.data.message || 'فشل في معالجة الدفع');
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'حدث خطأ أثناء معالجة الدفع';
      alert(`❌ خطأ في معالجة الدفع: ${errorMessage}`);
    }
  };

  // Export functions
  const exportToPDF = (data, filename, title) => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      pdf.setFontSize(16);
      pdf.text(title, 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`, 20, 30);
      pdf.text(`المستخدم: ${user?.full_name || 'غير محدد'}`, 20, 40);
      
      let yPosition = 60;
      pdf.setFontSize(10);
      
      data.slice(0, 15).forEach((item, index) => {
        let text = '';
        if (activeTab === 'debts') {
          text = `${index + 1}. عيادة: ${item.clinic_name || 'غير محدد'} | فاتورة: ${item.invoice_number || 'غير محدد'} | المبلغ: ${formatCurrency(item.remaining_amount)} | الحالة: ${getStatusLabel(item.status)}`;
        } else if (activeTab === 'collections') {
          text = `${index + 1}. المبلغ: ${formatCurrency(item.payment_amount)} | الطريقة: ${getPaymentMethodLabel(item.payment_method)} | التاريخ: ${formatDate(item.payment_date)}`;
        }
        
        pdf.text(text, 20, yPosition);
        yPosition += 8;
        
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
    }
  };

  const exportToExcel = (data, filename, sheetName) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      console.log('✅ Excel exported successfully');
    } catch (error) {
      console.error('❌ Error exporting Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getStatusColor = (status) => {
    const colors = {
      'outstanding': 'bg-red-100 text-red-800',
      'settled': 'bg-green-100 text-green-800',
      'partially_paid': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'outstanding': 'مستحق',
      'settled': 'مسدد',
      'partially_paid': 'مسدد جزئياً',
      'overdue': 'متأخر'
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'cash': 'نقدي',
      'check': 'شيك',
      'bank_transfer': 'تحويل بنكي',
      'card': 'بطاقة ائتمان'
    };
    return labels[method] || method;
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!canViewAllDebts) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">🚫 وصول محظور</h2>
          <p className="text-red-700">هذا القسم متاح للأدمن والمحاسبين والمديرين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">💰 إدارة الديون والتحصيل</h1>
            <p className="text-red-100">نظام شامل لإدارة المديونيات ومعالجة المدفوعات</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadDebtsData();
                loadCollectionsData();
                calculateDebtStats();
              }}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">الديون المستحقة</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(debtStats.total_outstanding)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">إجمالي المحصل</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(debtStats.total_collected)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">💵</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">ديون متأخرة</p>
              <p className="text-2xl font-bold text-orange-700">{formatNumber(debtStats.overdue_debts)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">معدل التحصيل</p>
              <p className="text-2xl font-bold text-blue-700">{debtStats.collection_rate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'debts', name: 'إدارة الديون', icon: '💳', count: filteredDebts.length },
            { id: 'collections', name: 'سجل التحصيل', icon: '💰', count: filteredCollections.length },
            { id: 'invoices', name: 'الفواتير المرتبطة', icon: '📄', count: invoices.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
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
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="ابحث بالعيادة أو الفاتورة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="outstanding">مستحق</option>
              <option value="settled">مسدد</option>
              <option value="partially_paid">مسدد جزئياً</option>
              <option value="overdue">متأخر</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ dateFrom: '', dateTo: '', status: 'all', clinic: '', rep: '', search: '' })}
              className="text-gray-600 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded-lg"
            >
              🔄 مسح
            </button>
            
            <button
              onClick={() => {
                const data = activeTab === 'debts' ? filteredDebts : filteredCollections;
                const title = activeTab === 'debts' ? 'تقرير الديون' : 'تقرير التحصيل';
                const filename = activeTab === 'debts' ? 'debts-report' : 'collections-report';
                exportToPDF(data, filename, title);
              }}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              📄 PDF
            </button>
            
            <button
              onClick={() => {
                const data = activeTab === 'debts' ? filteredDebts : filteredCollections;
                const filename = activeTab === 'debts' ? 'debts-data' : 'collections-data';
                const sheetName = activeTab === 'debts' ? 'الديون' : 'التحصيل';
                exportToExcel(data, filename, sheetName);
              }}
              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
            >
              📊 Excel
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="text-gray-700">جاري تحميل بيانات الديون والتحصيل...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Debts Tab */}
          {activeTab === 'debts' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>💳</span>
                  إدارة الديون
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">
                    {filteredDebts.length} دين
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العيادة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ المتبقي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الاستحقاق</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDebts.length > 0 ? (
                      filteredDebts.map((debt) => (
                        <tr key={debt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{debt.clinic_name || 'غير محدد'}</div>
                            <div className="text-sm text-gray-500">{debt.clinic_owner || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{debt.invoice_number || 'غير محدد'}</div>
                            <div className="text-sm text-gray-500">إنشاء: {debt.created_by_name || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-red-600">{formatCurrency(debt.remaining_amount)}</div>
                            <div className="text-sm text-gray-500">من أصل: {formatCurrency(debt.original_amount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{formatDate(debt.due_date)}</div>
                            {debt.status === 'outstanding' && debt.due_date && getDaysOverdue(debt.due_date) > 0 && (
                              <div className="text-red-500 text-xs">
                                متأخر {getDaysOverdue(debt.due_date)} يوم
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                              {getStatusLabel(debt.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {canManageDebts && debt.status === 'outstanding' && (
                                <button
                                  onClick={() => {
                                    setSelectedDebt(debt);
                                    setShowPaymentModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                                >
                                  💰 تحصيل
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setShowDebtDetails(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                📋 التفاصيل
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          لا توجد ديون متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>💰</span>
                  سجل التحصيل
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                    {filteredCollections.length} عملية
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الدفع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معالج بواسطة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الدين</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCollections.length > 0 ? (
                      filteredCollections.map((collection) => (
                        <tr key={collection.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-green-600">{formatCurrency(collection.payment_amount)}</div>
                            <div className="text-sm text-gray-500">متبقي: {formatCurrency(collection.remaining_debt_after_payment)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {getPaymentMethodLabel(collection.payment_method)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(collection.payment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{collection.processed_by_name || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {collection.debt_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {collection.payment_notes || 'لا توجد ملاحظات'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          لا توجد عمليات تحصيل متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>📄</span>
                  الفواتير المرتبطة
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                    {invoices.length} فاتورة
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العيادة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المندوب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة الدفع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{invoice.order_number || invoice.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{invoice.clinic_name || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{invoice.medical_rep_name || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                              invoice.payment_status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invoice.payment_status === 'paid' ? 'مدفوع' : 
                               invoice.payment_status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          لا توجد فواتير متاحة
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

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
              <h3 className="text-lg font-bold">💰 معالجة الدفع</h3>
              <p className="text-green-100">عيادة: {selectedDebt.clinic_name}</p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">المبلغ المتبقي: <span className="font-bold text-red-600">{formatCurrency(selectedDebt.remaining_amount)}</span></p>
                <p className="text-sm text-gray-600">فاتورة رقم: {selectedDebt.invoice_number}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ الدفع</label>
                  <input
                    type="number"
                    value={paymentForm.payment_amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_amount: e.target.value }))}
                    max={selectedDebt.remaining_amount}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="أدخل مبلغ الدفع"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="cash">نقدي</option>
                    <option value="check">شيك</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="card">بطاقة ائتمان</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="أضف ملاحظات إضافية..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({ payment_amount: '', payment_method: 'cash', notes: '' });
                    setSelectedDebt(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                
                <button
                  onClick={handleProcessPayment}
                  disabled={!paymentForm.payment_amount}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💰 معالجة الدفع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Details Modal */}
      {showDebtDetails && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <h3 className="text-lg font-bold">📋 تفاصيل الدين</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">العيادة</label>
                  <p className="mt-1 text-gray-900">{selectedDebt.clinic_name || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">مالك العيادة</label>
                  <p className="mt-1 text-gray-900">{selectedDebt.clinic_owner || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">رقم الفاتورة</label>
                  <p className="mt-1 text-gray-900 font-mono">{selectedDebt.invoice_number || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المبلغ الأصلي</label>
                  <p className="mt-1 text-gray-900 font-bold">{formatCurrency(selectedDebt.original_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المبلغ المتبقي</label>
                  <p className="mt-1 text-red-600 font-bold text-lg">{formatCurrency(selectedDebt.remaining_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الاستحقاق</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedDebt.due_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDebt.status)}`}>
                    {getStatusLabel(selectedDebt.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الإنشاء</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedDebt.created_at)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">الملاحظات</label>
                <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded-lg">
                  {selectedDebt.notes || 'لا توجد ملاحظات'}
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDebtDetails(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إغلاق
                </button>
                
                <button
                  onClick={() => exportToPDF([selectedDebt], `debt-${selectedDebt.id}`, `تفاصيل الدين - ${selectedDebt.clinic_name}`)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  📄 طباعة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtCollectionManagement;