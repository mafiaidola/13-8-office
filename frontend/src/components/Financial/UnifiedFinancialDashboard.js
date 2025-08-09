import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UnifiedFinancialDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({});
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    record_type: '',
    status: '',
    clinic_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview data
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const overviewResponse = await axios.get(`${backendUrl}/api/unified-financial/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (overviewResponse.data.success) {
        setOverviewData(overviewResponse.data.overview);
      }
      
      // Load records
      await loadRecords();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (currentFilters = filters) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const params = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const recordsResponse = await axios.get(`${backendUrl}/api/unified-financial/records?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (recordsResponse.data.success) {
        setRecords(recordsResponse.data.records);
      }
      
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadRecords(newFilters);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'partially_paid': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels = {
      'pending': 'معلق',
      'paid': 'مدفوع',
      'overdue': 'متأخر',
      'partially_paid': 'مدفوع جزئياً',
      'cancelled': 'ملغي'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getRecordTypeBadge = (type) => {
    const typeColors = {
      'invoice': 'bg-blue-100 text-blue-800',
      'debt': 'bg-orange-100 text-orange-800',
      'payment': 'bg-green-100 text-green-800',
      'collection': 'bg-purple-100 text-purple-800'
    };
    
    const typeLabels = {
      'invoice': 'فاتورة',
      'debt': 'دين',
      'payment': 'دفعة',
      'collection': 'تحصيل'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          النظام المالي الموحد
        </h1>
        <p className="text-gray-600">
          إدارة شاملة للفواتير والديون والتحصيلات في مكان واحد
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: '📊' },
              { id: 'invoices', label: 'الفواتير', icon: '🧾' },
              { id: 'debts', label: 'الديون', icon: '💳' },
              { id: 'payments', label: 'المدفوعات', icon: '💰' },
              { id: 'collections', label: 'التحصيلات', icon: '🏦' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">إجمالي السجلات</p>
                      <p className="text-2xl font-bold">{overviewData.total_records || 0}</p>
                    </div>
                    <div className="text-3xl opacity-80">📋</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">إجمالي المحصل</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(overviewData.financial_summary?.total_collected || 0)}
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">💰</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">المبلغ المتبقي</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(overviewData.financial_summary?.total_outstanding || 0)}
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">⏳</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">معدل التحصيل</p>
                      <p className="text-2xl font-bold">
                        {overviewData.financial_summary?.collection_rate || 0}%
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">📈</div>
                  </div>
                </div>
              </div>

              {/* Record Type Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع السجلات حسب النوع</h3>
                  <div className="space-y-3">
                    {Object.entries(overviewData.record_breakdown || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getRecordTypeBadge(type)}
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع السجلات حسب الحالة</h3>
                  <div className="space-y-3">
                    {Object.entries(overviewData.status_breakdown || {}).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status)}
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Performing Clinics */}
              {overviewData.top_performing_clinics && overviewData.top_performing_clinics.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">أفضل العيادات أداءً</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2">اسم العيادة</th>
                          <th className="text-right py-2">إجمالي القيمة</th>
                          <th className="text-right py-2">عدد السجلات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.top_performing_clinics.map((clinic, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{clinic.clinic_name}</td>
                            <td className="py-2">{formatCurrency(clinic.total_value)}</td>
                            <td className="py-2">{clinic.records_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Records List for other tabs */}
          {activeTab !== 'overview' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <select 
                  value={filters.record_type}
                  onChange={(e) => handleFilterChange('record_type', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="invoice">فاتورة</option>
                  <option value="debt">دين</option>
                  <option value="payment">دفعة</option>
                  <option value="collection">تحصيل</option>
                </select>
                
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">جميع الحالات</option>
                  <option value="pending">معلق</option>
                  <option value="paid">مدفوع</option>
                  <option value="overdue">متأخر</option>
                  <option value="partially_paid">مدفوع جزئياً</option>
                </select>
                
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="من تاريخ"
                />
                
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="إلى تاريخ"
                />
                
                <button
                  onClick={() => {
                    setFilters({
                      record_type: '',
                      status: '',
                      clinic_id: '',
                      start_date: '',
                      end_date: ''
                    });
                    loadRecords({});
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  إعادة تعيين
                </button>
              </div>

              {/* Records Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم السجل
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          النوع
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          العيادة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المبلغ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المتبقي
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تاريخ الاستحقاق
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.record_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRecordTypeBadge(record.record_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clinic_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.original_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.outstanding_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.due_date ? new Date(record.due_date).toLocaleDateString('ar-EG') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {records.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد سجلات لعرضها
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedFinancialDashboard;