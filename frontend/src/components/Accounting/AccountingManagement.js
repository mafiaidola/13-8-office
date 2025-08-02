// Enhanced Accounting Management Component - إدارة الحسابات والفواتير المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const AccountingManagement = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financialReports, setFinancialReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('this_month');
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch invoices, payments, and reports in parallel
      const [invoicesRes, paymentsRes, reportsRes] = await Promise.allSettled([
        axios.get(`${API}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/payments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/financial-reports`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (invoicesRes.status === 'fulfilled') {
        setInvoices(invoicesRes.value.data || []);
      } else {
        // Mock data for invoices
        setInvoices([
          {
            id: 'INV-2024-001',
            invoice_number: 'INV-2024-001',
            clinic_id: 'clinic-001',
            clinic_name: 'عيادة الدكتور أحمد محمد',
            doctor_name: 'د. أحمد محمد',
            total_amount: 1250.00,
            paid_amount: 1250.00,
            remaining_amount: 0.00,
            status: 'paid',
            issue_date: '2024-01-15T10:00:00Z',
            due_date: '2024-02-15T10:00:00Z',
            payment_date: '2024-01-20T14:30:00Z',
            created_by: 'admin',
            items: [
              { product_name: 'أموكسيسيلين 500mg', quantity: 10, unit_price: 85.00, total: 850.00 },
              { product_name: 'باراسيتامول 500mg', quantity: 20, unit_price: 20.00, total: 400.00 }
            ]
          },
          {
            id: 'INV-2024-002',
            invoice_number: 'INV-2024-002',
            clinic_id: 'clinic-002',
            clinic_name: 'مركز الشفاء الطبي',
            doctor_name: 'د. فاطمة علي',
            total_amount: 850.00,
            paid_amount: 300.00,
            remaining_amount: 550.00,
            status: 'partial',
            issue_date: '2024-01-20T09:00:00Z',
            due_date: '2024-02-20T09:00:00Z',
            payment_date: null,
            created_by: 'admin',
            items: [
              { product_name: 'إيبوبروفين 400mg', quantity: 15, unit_price: 35.00, total: 525.00 },
              { product_name: 'فيتامين د3', quantity: 13, unit_price: 25.00, total: 325.00 }
            ]
          },
          {
            id: 'INV-2024-003',
            invoice_number: 'INV-2024-003',
            clinic_id: 'clinic-003',
            clinic_name: 'عيادة النور',
            doctor_name: 'د. محمود سالم',
            total_amount: 650.00,
            paid_amount: 0.00,
            remaining_amount: 650.00,
            status: 'pending',
            issue_date: '2024-01-25T11:00:00Z',
            due_date: '2024-02-25T11:00:00Z',
            payment_date: null,
            created_by: 'admin',
            items: [
              { product_name: 'مضاد حيوي طبيعي', quantity: 25, unit_price: 26.00, total: 650.00 }
            ]
          }
        ]);
      }

      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data || []);
      } else {
        // Mock data for payments
        setPayments([
          {
            id: 'PAY-001',
            invoice_id: 'INV-2024-001',
            invoice_number: 'INV-2024-001',
            clinic_name: 'عيادة الدكتور أحمد محمد',
            amount: 1250.00,
            payment_method: 'cash',
            payment_date: '2024-01-20T14:30:00Z',
            reference_number: 'REF-001',
            notes: 'دفع نقدي كامل',
            received_by: 'admin'
          },
          {
            id: 'PAY-002',
            invoice_id: 'INV-2024-002',
            invoice_number: 'INV-2024-002',
            clinic_name: 'مركز الشفاء الطبي',
            amount: 300.00,
            payment_method: 'bank_transfer',
            payment_date: '2024-01-22T16:00:00Z',
            reference_number: 'REF-002',
            notes: 'تحويل بنكي جزئي',
            received_by: 'admin'
          }
        ]);
      }

      if (reportsRes.status === 'fulfilled') {
        setFinancialReports(reportsRes.value.data || []);
      } else {
        // Mock data for financial reports
        setFinancialReports([
          {
            period: 'يناير 2024',
            total_invoices: 125,
            total_amount: 156750.00,
            paid_amount: 142500.00,
            pending_amount: 14250.00,
            collection_rate: 91.0
          }
        ]);
      }

    } catch (error) {
      console.error('خطأ في جلب بيانات المحاسبة:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API}/invoices`, invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ تم إنشاء الفاتورة بنجاح:', response.data);
      fetchAccountingData();
      setShowInvoiceModal(false);
      alert('تم إنشاء الفاتورة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في إنشاء الفاتورة:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة');
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ تم تسجيل الدفعة بنجاح:', response.data);
      fetchAccountingData();
      setShowPaymentModal(false);
      alert('تم تسجيل الدفعة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدفعة:', error);
      alert('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status) => {
    const labels = {
      'paid': 'مدفوعة',
      'partial': 'مدفوعة جزئياً',
      'pending': 'معلقة',
      'overdue': 'متأخرة'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'bg-green-500/20 text-green-300',
      'partial': 'bg-yellow-500/20 text-yellow-300',
      'pending': 'bg-blue-500/20 text-blue-300',
      'overdue': 'bg-red-500/20 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderOverview = () => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidAmount = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <div className="text-sm opacity-75">إجمالي الفواتير</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
                <div className="text-sm opacity-75">إجمالي المبلغ</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <div className="text-xl font-bold">{formatCurrency(paidAmount)}</div>
                <div className="text-sm opacity-75">المبلغ المحصل</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <span className="text-xl">⏳</span>
              </div>
              <div>
                <div className="text-xl font-bold">{formatCurrency(pendingAmount)}</div>
                <div className="text-sm opacity-75">المبلغ المعلق</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4">معدل التحصيل</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>معدل التحصيل</span>
                <span>{collectionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                {collectionRate >= 80 ? '🎯' : collectionRate >= 60 ? '📈' : '⚠️'}
              </div>
              <div className="text-xs">
                {collectionRate >= 80 ? 'ممتاز' : collectionRate >= 60 ? 'جيد' : 'يحتاج تحسين'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">آخر الفواتير</h3>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              عرض الكل →
            </button>
          </div>
          <div className="space-y-3">
            {invoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg">🧾</div>
                  <div>
                    <div className="font-medium">{invoice.invoice_number}</div>
                    <div className="text-sm opacity-75">{invoice.clinic_name}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInvoices = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <input
            type="text"
            placeholder="البحث برقم الفاتورة أو اسم العيادة أو الطبيب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="partial">مدفوعة جزئياً</option>
            <option value="pending">معلقة</option>
            <option value="overdue">متأخرة</option>
          </select>
        </div>
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          إنشاء فاتورة جديدة
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">رقم الفاتورة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الطبيب</th>
                <th className="px-6 py-4 text-right text-sm font-medium">إجمالي المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المبلغ المدفوع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المبلغ المتبقي</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تاريخ الإصدار</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-400">{invoice.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{invoice.clinic_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {invoice.doctor_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(invoice.paid_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={invoice.remaining_amount > 0 ? 'text-orange-400' : 'text-green-400'}>
                      {formatCurrency(invoice.remaining_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                        disabled={invoice.remaining_amount === 0}
                      >
                        دفع
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          // Add view/edit invoice logic
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        عرض
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧾</div>
          <h3 className="text-xl font-bold mb-2">لا توجد فواتير</h3>
          <p className="text-gray-600">لم يتم العثور على فواتير مطابقة للبحث المطلوب</p>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">سجل المدفوعات</h3>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">رقم الدفعة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">رقم الفاتورة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-medium">طريقة الدفع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تاريخ الدفع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المرجع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">استقبال بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-green-400">{payment.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-400">{payment.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {payment.clinic_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-400">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {payment.payment_method === 'cash' ? 'نقدي' : 
                       payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 
                       payment.payment_method === 'check' ? 'شيك' : 'بطاقة ائتمان'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {payment.reference_number}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {payment.received_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الحسابات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">💰</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">إدارة الحسابات والفواتير</h1>
            <p className="text-lg opacity-75">إدارة شاملة للفواتير والمدفوعات والتقارير المالية</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊' },
            { id: 'invoices', name: 'الفواتير', icon: '🧾' },
            { id: 'payments', name: 'المدفوعات', icon: '💳' },
            { id: 'reports', name: 'التقارير المالية', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-300 border-b-2 border-green-400'
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
          {activeTab === 'invoices' && renderInvoices()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2">التقارير المالية</h3>
              <p className="text-gray-600">سيتم إضافة التقارير المالية المفصلة قريباً</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          onClose={() => setShowInvoiceModal(false)}
          onSave={handleCreateInvoice}
          language={language}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onSave={handleRecordPayment}
          language={language}
        />
      )}
    </div>
  );
};

// Invoice Modal Component
const InvoiceModal = ({ onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    clinic_name: '',
    doctor_name: '',
    items: [{ product_name: '', quantity: 1, unit_price: 0, total: 0 }],
    notes: ''
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const invoiceData = {
      ...formData,
      total_amount: getTotalAmount(),
      status: 'pending',
      issue_date: new Date().toISOString()
    };
    onSave(invoiceData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">إنشاء فاتورة جديدة</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">اسم العيادة *</label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinic_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم الطبيب *</label>
                <input
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctor_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">عناصر الفاتورة *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + إضافة عنصر
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-white/5 rounded-lg">
                    <div>
                      <input
                        type="text"
                        placeholder="اسم المنتج"
                        value={item.product_name}
                        onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="السعر"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={`${item.total.toFixed(2)} ج.م`}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-600 border border-white/20 rounded text-sm text-gray-300"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                        disabled={formData.items.length === 1}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-left mt-4 p-3 bg-white/10 rounded-lg">
                <div className="text-lg font-bold">
                  الإجمالي: {getTotalAmount().toFixed(2)} ج.م
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                إنشاء الفاتورة
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

// Payment Modal Component
const PaymentModal = ({ invoice, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    invoice_id: invoice.id,
    amount: invoice.remaining_amount,
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const paymentData = {
      ...formData,
      payment_date: new Date().toISOString()
    };
    onSave(paymentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-lg w-full border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">تسجيل دفعة جديدة</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>

          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <div className="text-sm opacity-75 mb-2">تفاصيل الفاتورة</div>
            <div className="font-medium">{invoice.invoice_number}</div>
            <div className="text-sm">{invoice.clinic_name}</div>
            <div className="text-sm mt-2">
              <span>المبلغ المتبقي: </span>
              <span className="font-bold text-orange-400">
                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(invoice.remaining_amount)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">مبلغ الدفعة *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                max={invoice.remaining_amount}
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">طريقة الدفع *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="credit_card">بطاقة ائتمان</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم المرجع</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="رقم الشيك أو رقم التحويل..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                تسجيل الدفعة
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

export default AccountingManagement;