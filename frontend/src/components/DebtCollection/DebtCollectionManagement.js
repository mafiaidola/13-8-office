import React, { useState, useEffect } from 'react';

const DebtCollectionManagement = ({ user, language = 'ar', isRTL = true }) => {
  const [activeTab, setActiveTab] = useState('debts');
  const [debts, setDebts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });

  // Backend URL from environment
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchDebts();
    fetchCollections();
    fetchSummary();
  }, []);

  const fetchDebts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/debts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDebts(data);
      } else {
        console.error('Failed to fetch debts');
        // Mock data for testing
        setDebts([
          {
            id: '1',
            debt_number: 'DEBT-20250102-ABC12345',
            clinic_name: 'عيادة د. أحمد محمد',
            doctor_name: 'د. أحمد محمد',
            medical_rep_name: 'محمد علي',
            original_amount: 15000,
            outstanding_amount: 12000,
            paid_amount: 3000,
            status: 'partial',
            priority: 'high',
            debt_date: '2025-01-15',
            due_date: '2025-02-15',
            created_at: '2025-01-15T10:00:00Z'
          },
          {
            id: '2',
            debt_number: 'DEBT-20250102-XYZ67890',
            clinic_name: 'مركز النور الطبي',
            doctor_name: 'د. فاطمة حسن',
            medical_rep_name: 'أحمد محمود',
            original_amount: 8500,
            outstanding_amount: 8500,
            paid_amount: 0,
            status: 'pending',
            priority: 'medium',
            debt_date: '2025-01-10',
            due_date: '2025-02-10',
            created_at: '2025-01-10T09:00:00Z'
          },
          {
            id: '3',
            debt_number: 'DEBT-20250101-DEF54321',
            clinic_name: 'عيادة الشفاء',
            doctor_name: 'د. محمد أحمد',
            medical_rep_name: 'سارة علي',
            original_amount: 5000,
            outstanding_amount: 0,
            paid_amount: 5000,
            status: 'paid',
            priority: 'low',
            debt_date: '2024-12-20',
            due_date: '2025-01-20',
            created_at: '2024-12-20T14:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
      // Set mock data on error
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/debts/collections/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      } else {
        // Mock collections data
        setCollections([
          {
            id: '1',
            debt_number: 'DEBT-20250102-ABC12345',
            collection_amount: 3000,
            collection_method: 'cash',
            collection_status: 'successful',
            collector_name: 'محمد علي',
            collection_date: '2025-01-20',
            created_at: '2025-01-20T11:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/debts/summary/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        // Mock summary data
        setSummary({
          total_debts: 3,
          total_amount: 28500,
          paid_amount: 8000,
          outstanding_amount: 20500,
          overdue_amount: 5000,
          pending_count: 1,
          partial_count: 1,
          paid_count: 1,
          overdue_count: 0,
          high_priority_count: 1,
          medium_priority_count: 1,
          low_priority_count: 1
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary({});
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'disputed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'paid': { ar: 'مدفوع', en: 'Paid' },
      'partial': { ar: 'جزئي', en: 'Partial' },
      'pending': { ar: 'معلق', en: 'Pending' },
      'overdue': { ar: 'متأخر', en: 'Overdue' },
      'disputed': { ar: 'متنازع', en: 'Disputed' }
    };
    return statusMap[status] ? statusMap[status][language] : status;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-red-800 bg-red-200';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'high': { ar: 'عالي', en: 'High' },
      'urgent': { ar: 'عاجل', en: 'Urgent' },
      'medium': { ar: 'متوسط', en: 'Medium' },
      'low': { ar: 'منخفض', en: 'Low' }
    };
    return priorityMap[priority] ? priorityMap[priority][language] : priority;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const filteredDebts = debts.filter(debt => {
    const matchesStatus = filters.status === 'all' || debt.status === filters.status;
    const matchesPriority = filters.priority === 'all' || debt.priority === filters.priority;
    const matchesSearch = !filters.search || 
      debt.clinic_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      debt.doctor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      debt.debt_number.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handlePrintDebt = async (debtId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/debts/${debtId}/print`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Print data prepared:', data);
        // In a real implementation, this would trigger the print dialog
        alert(language === 'ar' ? 'تم تحضير بيانات الطباعة' : 'Print data prepared');
      }
    } catch (error) {
      console.error('Error preparing print:', error);
    }
  };

  const handleExportPDF = async (debtId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/debts/${debtId}/export/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('PDF data prepared:', data);
        // In a real implementation, this would download the PDF
        alert(language === 'ar' ? 'تم تحضير ملف PDF' : 'PDF prepared');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'إدارة الديون والتحصيل' : 'Debt & Collection Management'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'إدارة شاملة للديون والمتابعة مع إمكانيات الطباعة والتصدير' 
            : 'Comprehensive debt management and follow-up with print and export capabilities'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">
                {language === 'ar' ? 'إجمالي الديون' : 'Total Debts'}
              </p>
              <p className="text-2xl font-bold">{summary.total_debts || 0}</p>
            </div>
            <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">
                {language === 'ar' ? 'المبلغ المحصل' : 'Collected Amount'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(summary.paid_amount || 0)}</p>
            </div>
            <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">
                {language === 'ar' ? 'المبلغ المستحق' : 'Outstanding Amount'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(summary.outstanding_amount || 0)}</p>
            </div>
            <div className="p-3 bg-orange-400 bg-opacity-30 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">
                {language === 'ar' ? 'المتأخرات' : 'Overdue Amount'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(summary.overdue_amount || 0)}</p>
            </div>
            <div className="p-3 bg-red-400 bg-opacity-30 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap border-b">
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'debts'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {language === 'ar' ? 'قائمة الديون' : 'Debts List'}
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'collections'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {language === 'ar' ? 'سجل التحصيل' : 'Collections Log'}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {language === 'ar' ? 'التقارير' : 'Reports'}
          </button>
        </div>
      </div>

      {/* Debts Tab */}
      {activeTab === 'debts' && (
        <div>
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                  <option value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
                  <option value="partial">{language === 'ar' ? 'جزئي' : 'Partial'}</option>
                  <option value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
                  <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{language === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option>
                  <option value="high">{language === 'ar' ? 'عالي' : 'High'}</option>
                  <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                  <option value="low">{language === 'ar' ? 'منخفض' : 'Low'}</option>
                </select>
              </div>

              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث في الديون...' : 'Search debts...'}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {(user?.role === 'admin' || user?.role === 'accountant') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                <span>+</span>
                {language === 'ar' ? 'إضافة دين جديد' : 'Add New Debt'}
              </button>
            )}
          </div>

          {/* Debts Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'رقم الدين' : 'Debt Number'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'العيادة' : 'Clinic'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المندوب' : 'Medical Rep'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المبلغ الأصلي' : 'Original Amount'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المبلغ المستحق' : 'Outstanding'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الأولوية' : 'Priority'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الاستحقاق' : 'Due Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDebts.map((debt) => (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {debt.debt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{debt.clinic_name}</div>
                          <div className="text-sm text-gray-500">{debt.doctor_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.medical_rep_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(debt.original_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                        {formatCurrency(debt.outstanding_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                          {getStatusText(debt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(debt.priority)}`}>
                          {getPriorityText(debt.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(debt.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDebt(debt);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          >
                            👁️
                          </button>
                          
                          {debt.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedDebt(debt);
                                setShowCollectionModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 transition-colors duration-200"
                              title={language === 'ar' ? 'تسجيل تحصيل' : 'Record Collection'}
                            >
                              💰
                            </button>
                          )}

                          <button
                            onClick={() => handlePrintDebt(debt.id)}
                            className="text-purple-600 hover:text-purple-800 transition-colors duration-200"
                            title={language === 'ar' ? 'طباعة' : 'Print'}
                          >
                            🖨️
                          </button>

                          <button
                            onClick={() => handleExportPDF(debt.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            title={language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                          >
                            📄
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDebts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                  {language === 'ar' ? 'لا توجد ديون' : 'No debts found'}
                </div>
                <div className="text-gray-400 text-sm">
                  {language === 'ar' ? 'قم بتعديل المرشحات أو إضافة ديون جديدة' : 'Adjust filters or add new debts'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'سجل التحصيلات' : 'Collections Log'}
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-center py-8">
              {language === 'ar' ? 'سيتم عرض سجل التحصيلات هنا' : 'Collections log will be displayed here'}
            </p>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-center py-8">
              {language === 'ar' ? 'سيتم عرض التقارير المالية هنا' : 'Financial reports will be displayed here'}
            </p>
          </div>
        </div>
      )}

      {/* Modals would be added here for create, collection, and details */}
      {showDetailsModal && selectedDebt && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h3>{language === 'ar' ? 'تفاصيل الدين' : 'Debt Details'}</h3>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'رقم الدين' : 'Debt Number'}
                  </label>
                  <p className="text-gray-900 font-mono">{selectedDebt.debt_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'العيادة' : 'Clinic'}
                  </label>
                  <p className="text-gray-900">{selectedDebt.clinic_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'الطبيب' : 'Doctor'}
                  </label>
                  <p className="text-gray-900">{selectedDebt.doctor_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'المندوب الطبي' : 'Medical Rep'}
                  </label>
                  <p className="text-gray-900">{selectedDebt.medical_rep_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'المبلغ الأصلي' : 'Original Amount'}
                  </label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(selectedDebt.original_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}
                  </label>
                  <p className="text-green-600 font-semibold">{formatCurrency(selectedDebt.paid_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'المبلغ المستحق' : 'Outstanding Amount'}
                  </label>
                  <p className="text-orange-600 font-semibold">{formatCurrency(selectedDebt.outstanding_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDebt.status)}`}>
                    {getStatusText(selectedDebt.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'تاريخ الدين' : 'Debt Date'}
                  </label>
                  <p className="text-gray-900">{formatDate(selectedDebt.debt_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <p className="text-gray-900">{formatDate(selectedDebt.due_date)}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtCollectionManagement;