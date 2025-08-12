// Professional Accounting System - النظام المحاسبي الاحترافي الشامل
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const ProfessionalAccountingSystem = ({ language = 'ar', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadAccountingData();
    loadSupportingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // تحميل لوحة التحكم
      const dashboardResponse = await fetch(`${API_URL}/api/accounting/dashboard`, { headers });
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult.dashboard);
      }

      // تحميل الفواتير
      const invoicesResponse = await fetch(`${API_URL}/api/accounting/invoices`, { headers });
      if (invoicesResponse.ok) {
        const invoicesResult = await invoicesResponse.json();
        setInvoices(invoicesResult.invoices || []);
      }

      // تحميل الديون
      const debtsResponse = await fetch(`${API_URL}/api/debts`, { headers });
      if (debtsResponse.ok) {
        const debtsResult = await debtsResponse.json();
        setDebts(debtsResult.debts || []);
      }

      // تحميل التحصيلات
      const collectionsResponse = await fetch(`${API_URL}/api/collections`, { headers });
      if (collectionsResponse.ok) {
        const collectionsResult = await collectionsResponse.json();
        setCollections(collectionsResult.collections || []);
      }

    } catch (error) {
      console.error('خطأ في تحميل البيانات المحاسبية:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // تحميل العيادات
      const clinicsResponse = await fetch(`${API_URL}/api/clinics`, { headers });
      if (clinicsResponse.ok) {
        const clinicsResult = await clinicsResponse.json();
        setClinics(clinicsResult.clinics || clinicsResult || []);
      }

      // تحميل المنتجات
      const productsResponse = await fetch(`${API_URL}/api/products`, { headers });
      if (productsResponse.ok) {
        const productsResult = await productsResponse.json();
        setProducts(productsResult.products || productsResult || []);
      }

    } catch (error) {
      console.error('خطأ في تحميل البيانات المساعدة:', error);
    }
  };

  // تنسيق المبالغ المالية
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // إنشاء فاتورة جديدة
  const createInvoice = async (invoiceData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/accounting/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        await comprehensiveActivityService.recordInvoiceCreation(result.invoice);
        await loadAccountingData();
        setShowInvoiceModal(false);
        return result;
      }
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error);
    }
  };

  // إنشاء دين جديد
  const createDebt = async (debtData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/accounting/debts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(debtData)
      });

      if (response.ok) {
        const result = await response.json();
        await loadAccountingData();
        setShowDebtModal(false);
        return result;
      }
    } catch (error) {
      console.error('خطأ في إنشاء الدين:', error);
    }
  };

  return (
    <div className="professional-accounting-system min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">💰</span>
                النظام المحاسبي الاحترافي الشامل
              </h1>
              <p className="text-emerald-100 text-lg">
                إدارة متكاملة للفواتير والديون والتحصيل مع تكامل كامل لقاعدة البيانات
              </p>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={loadAccountingData}
                disabled={loading}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? '⏳' : '🔄'} تحديث البيانات
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'dashboard', name: 'لوحة التحكم', icon: '📊' },
              { id: 'invoices', name: 'إدارة الفواتير', icon: '📄' },
              { id: 'debts', name: 'إدارة الديون', icon: '💳' },
              { id: 'collections', name: 'إدارة التحصيل', icon: '💰' },
              { id: 'reports', name: 'التقارير المالية', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">إجمالي الفواتير</p>
                    <p className="text-3xl font-bold">{dashboardData.invoices?.total || 0}</p>
                  </div>
                  <div className="text-4xl">📄</div>
                </div>
                <div className="text-blue-100 text-sm">
                  المدفوع: {dashboardData.invoices?.paid || 0} | المعلق: {dashboardData.invoices?.pending || 0}
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-red-100 text-sm mb-1">إجمالي الديون</p>
                    <p className="text-3xl font-bold">{dashboardData.debts?.total || 0}</p>
                  </div>
                  <div className="text-4xl">💳</div>
                </div>
                <div className="text-red-100 text-sm">
                  نشط: {dashboardData.debts?.active || 0} | محصل: {dashboardData.debts?.collected || 0}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-green-100 text-sm mb-1">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold">{formatCurrency(dashboardData.invoices?.total_amount)}</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
                <div className="text-green-100 text-sm">
                  معدل السداد: {dashboardData.payment_rate || 0}%
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">معدل التحصيل</p>
                    <p className="text-3xl font-bold">{dashboardData.collection_rate || 0}%</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
                <div className="text-purple-100 text-sm">
                  المحصل: {formatCurrency(dashboardData.debts?.collected_amount)}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-blue-600 ml-3 text-2xl">⚡</span>
                  الأنشطة المالية الحديثة
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(dashboardData.recent_activities || []).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mr-3">
                        {activity.action === 'invoice_create' ? '📄' :
                         activity.action === 'debt_create' ? '💳' :
                         activity.action === 'collection_create' ? '💰' : '📝'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{activity.description}</p>
                        <p className="text-gray-600 text-sm">
                          {activity.user_name} - {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-red-600 ml-3 text-2xl">⚠️</span>
                  العيادات ذات الديون العالية
                </h3>
                
                <div className="space-y-4">
                  {(dashboardData.high_debt_clinics || []).slice(0, 10).map((clinic, index) => (
                    <div key={clinic._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{clinic.clinic_name}</p>
                        <p className="text-gray-600 text-sm">{clinic.debt_count} ديون</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(clinic.total_debt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">إدارة الفواتير</h2>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                ➕ إنشاء فاتورة جديدة
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right p-4 font-semibold text-gray-700">رقم الفاتورة</th>
                      <th className="text-right p-4 font-semibold text-gray-700">العيادة</th>
                      <th className="text-right p-4 font-semibold text-gray-700">المبلغ</th>
                      <th className="text-right p-4 font-semibold text-gray-700">الحالة</th>
                      <th className="text-right p-4 font-semibold text-gray-700">تاريخ الإنشاء</th>
                      <th className="text-right p-4 font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono">{invoice.invoice_number}</td>
                        <td className="p-4">{invoice.clinic_name}</td>
                        <td className="p-4 font-bold text-green-600">{formatCurrency(invoice.total_amount)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? 'مدفوعة' :
                             invoice.status === 'pending' ? 'معلقة' : 'متأخرة'}
                          </span>
                        </td>
                        <td className="p-4">{formatDate(invoice.created_at)}</td>
                        <td className="p-4">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all"
                            >
                              📄 عرض
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                            >
                              🖨️ طباعة
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
        )}

        {/* Other tabs content would continue here... */}
        
      </div>
    </div>
  );
};

export default ProfessionalAccountingSystem;