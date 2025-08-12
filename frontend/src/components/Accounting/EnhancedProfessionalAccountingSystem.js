// Enhanced Professional Accounting System - النظام المحاسبي الاحترافي المحسن
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const EnhancedProfessionalAccountingSystem = ({ language = 'ar', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [dashboardData, setDashboardData] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modal states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [printMode, setPrintMode] = useState(false);

  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    clinic_id: '',
    rep_id: '',
    items: [],
    subtotal: 0,
    discount_type: 'percentage', // percentage or fixed
    discount_value: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_terms: 'cash',
    due_date: '',
    notes: '',
    created_by: user?.id || ''
  });

  // Debt Form State
  const [debtForm, setDebtForm] = useState({
    clinic_id: '',
    rep_id: '',
    description: '',
    items: [],
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: 0,
    due_date: '',
    priority: 'medium',
    category: 'purchase',
    created_by: user?.id || ''
  });

  // Collection Form State
  const [collectionForm, setCollectionForm] = useState({
    invoice_id: '',
    debt_id: '',
    payment_type: 'full', // full, partial, items
    amount: 0,
    selected_items: [],
    payment_method: 'cash',
    receipt_number: '',
    notes: '',
    collected_by: user?.id || ''
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadAccountingData();
    loadSupportingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // تحميل لوحة التحكم
      if (activeTab === 'dashboard') {
        const dashboardResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/dashboard`, { headers });
        if (dashboardResponse.ok) {
          const dashboardResult = await dashboardResponse.json();
          setDashboardData(dashboardResult.dashboard || dashboardResult.data || {});
        }
      }

      // تحميل الفواتير
      if (activeTab === 'invoices' || activeTab === 'dashboard') {
        const invoicesResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/invoices`, { headers });
        if (invoicesResponse.ok) {
          const invoicesResult = await invoicesResponse.json();
          setInvoices(invoicesResult.invoices || []);
        }
      }

      // تحميل الديون
      if (activeTab === 'debts' || activeTab === 'dashboard') {
        const debtsResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/debts`, { headers });
        if (debtsResponse.ok) {
          const debtsResult = await debtsResponse.json();
          setDebts(debtsResult.debts || []);
        }
      }

      // تحميل التحصيلات
      if (activeTab === 'collections' || activeTab === 'dashboard') {
        const collectionsResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/collections`, { headers });
        if (collectionsResponse.ok) {
          const collectionsResult = await collectionsResponse.json();
          setCollections(collectionsResult.collections || []);
        }
      }

    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // تحميل البيانات الداعمة
      const [clinicsResponse, productsResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/api/clinics`, { headers }),
        fetch(`${API_URL}/api/products`, { headers }),
        fetch(`${API_URL}/api/users`, { headers })
      ]);

      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        setClinics(Array.isArray(clinicsData) ? clinicsData : clinicsData.clinics || []);
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      }

    } catch (error) {
      console.error('Error loading supporting data:', error);
    }
  };

  // Invoice Functions
  const addItemToInvoice = () => {
    const newItem = {
      id: Date.now(),
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, newItem]
    });
  };

  const updateInvoiceItem = (itemIndex, field, value) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[itemIndex][field] = value;

    // إذا تم تغيير المنتج، حدث السعر
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[itemIndex].product_name = product.name;
        updatedItems[itemIndex].unit_price = product.price || 0;
      }
    }

    // احسب المجموع للصنف
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[itemIndex].total_price = 
        updatedItems[itemIndex].quantity * updatedItems[itemIndex].unit_price;
    }

    setInvoiceForm({ ...invoiceForm, items: updatedItems });
    calculateInvoiceTotal({ ...invoiceForm, items: updatedItems });
  };

  const removeInvoiceItem = (itemIndex) => {
    const updatedItems = invoiceForm.items.filter((_, index) => index !== itemIndex);
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
    calculateInvoiceTotal({ ...invoiceForm, items: updatedItems });
  };

  const calculateInvoiceTotal = (formData = invoiceForm) => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_price, 0);
    let discountAmount = 0;

    if (formData.discount_type === 'percentage') {
      discountAmount = (subtotal * formData.discount_value) / 100;
    } else {
      discountAmount = formData.discount_value;
    }

    const totalAmount = subtotal - discountAmount;

    setInvoiceForm({
      ...formData,
      subtotal,
      discount_amount: discountAmount,
      total_amount: Math.max(0, totalAmount)
    });
  };

  const handleCreateInvoice = async () => {
    try {
      if (!invoiceForm.clinic_id || !invoiceForm.rep_id || invoiceForm.items.length === 0) {
        alert('يرجى ملء جميع الحقول المطلوبة وإضافة منتج واحد على الأقل');
        return;
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/professional-accounting/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...invoiceForm,
          created_by_name: user?.full_name || 'مستخدم غير معروف'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // تسجيل النشاط
        await comprehensiveActivityService.recordActivity({
          action: 'invoice_create',
          description: `إنشاء فاتورة بقيمة ${invoiceForm.total_amount} ج.م`,
          additional_data: {
            invoice_id: result.invoice.id,
            clinic_id: invoiceForm.clinic_id,
            total_amount: invoiceForm.total_amount
          }
        });

        alert('تم إنشاء الفاتورة بنجاح!');
        setShowCreateInvoiceModal(false);
        resetInvoiceForm();
        loadAccountingData();
      } else {
        const error = await response.json();
        alert(`خطأ في إنشاء الفاتورة: ${error.detail || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('حدث خطأ في إنشاء الفاتورة');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clinic_id: '',
      rep_id: '',
      items: [],
      subtotal: 0,
      discount_type: 'percentage',
      discount_value: 0,
      discount_amount: 0,
      total_amount: 0,
      payment_terms: 'cash',
      due_date: '',
      notes: '',
      created_by: user?.id || ''
    });
  };

  // Print Invoice Function
  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    const clinic = clinics.find(c => c.id === invoice.clinic_id);
    const rep = users.find(u => u.id === invoice.rep_id);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة #${invoice.id.slice(-8)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; margin: 0; padding: 20px; }
          .invoice-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .invoice-title { font-size: 22px; opacity: 0.9; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-section { flex: 1; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 0 10px; }
          .info-title { font-weight: bold; color: #495057; margin-bottom: 15px; font-size: 16px; }
          .info-item { margin-bottom: 8px; display: flex; justify-content: space-between; }
          .info-label { color: #6c757d; }
          .info-value { font-weight: 600; color: #212529; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th, .items-table td { padding: 15px; text-align: right; border-bottom: 1px solid #dee2e6; }
          .items-table th { background: #f8f9fa; font-weight: bold; color: #495057; }
          .items-table tr:hover { background: #f8f9fa; }
          .totals-section { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-top: 30px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; }
          .total-label { color: #6c757d; }
          .total-value { font-weight: 600; }
          .final-total { border-top: 2px solid #007bff; padding-top: 15px; font-size: 20px; font-weight: bold; color: #007bff; }
          .footer { margin-top: 40px; text-align: center; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 20px; }
          .created-by { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; color: #1976d2; font-weight: 600; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-name">🏥 EP Group - المجموعة الاحترافية للخدمات الطبية</div>
          <div class="invoice-title">فاتورة رقم: #${invoice.id.slice(-8)}</div>
        </div>
        
        <div class="invoice-info">
          <div class="info-section">
            <div class="info-title">🏥 بيانات العيادة</div>
            <div class="info-item">
              <span class="info-label">اسم العيادة:</span>
              <span class="info-value">${clinic?.clinic_name || 'غير محدد'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">اسم الدكتور:</span>
              <span class="info-value">${clinic?.doctor_name || 'غير محدد'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">هاتف العيادة:</span>
              <span class="info-value">${clinic?.clinic_phone || 'غير محدد'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">📊 بيانات الفاتورة</div>
            <div class="info-item">
              <span class="info-label">تاريخ الإنشاء:</span>
              <span class="info-value">${new Date(invoice.created_at).toLocaleDateString('ar-EG')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المندوب المسؤول:</span>
              <span class="info-value">${rep?.full_name || 'غير محدد'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">شروط الدفع:</span>
              <span class="info-value">${invoice.payment_terms === 'cash' ? 'نقدي' : 'آجل'}</span>
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المنتج</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price.toLocaleString()} ج.م</td>
                <td>${item.total_price.toLocaleString()} ج.م</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-row">
            <span class="total-label">المجموع الفرعي:</span>
            <span class="total-value">${(invoice.subtotal || 0).toLocaleString()} ج.م</span>
          </div>
          ${invoice.discount_amount > 0 ? `
            <div class="total-row">
              <span class="total-label">الخصم (${invoice.discount_type === 'percentage' ? invoice.discount_value + '%' : 'مبلغ ثابت'}):</span>
              <span class="total-value">-${(invoice.discount_amount || 0).toLocaleString()} ج.م</span>
            </div>
          ` : ''}
          <div class="total-row final-total">
            <span class="total-label">المبلغ الإجمالي:</span>
            <span class="total-value">${(invoice.total_amount || 0).toLocaleString()} ج.م</span>
          </div>
        </div>
        
        <div class="created-by">
          📝 تم إنشاء هذه الفاتورة بواسطة: ${invoice.created_by_name || user?.full_name || 'مستخدم غير معروف'}
        </div>
        
        ${invoice.notes ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; color: #856404;">
            <strong>ملاحظات:</strong> ${invoice.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>شكراً لتعاملكم معنا | EP Group Professional Services</p>
          <p>تم الطباعة في: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const tabs = [
    { id: 'dashboard', name: 'لوحة التحكم المالية', icon: '📊' },
    { id: 'invoices', name: 'إدارة الفواتير', icon: '📄' },
    { id: 'debts', name: 'إدارة الديون', icon: '💳' },
    { id: 'collections', name: 'إدارة التحصيل', icon: '💰' },
    { id: 'reports', name: 'التقارير المالية', icon: '📈' }
  ];

  return (
    <div className="enhanced-accounting-system min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">💰</span>
                النظام المحاسبي الاحترافي المحسن
              </h1>
              <p className="text-indigo-100 text-lg">
                نظام شامل لإدارة الفواتير والديون والتحصيل مع تكامل كامل
              </p>
            </div>
            
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-indigo-100">المستخدم الحالي</p>
                <p className="font-bold text-lg">{user?.full_name || 'مستخدم غير محدد'}</p>
                <p className="text-sm text-indigo-200">{user?.role || 'دور غير محدد'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  loadAccountingData();
                }}
                className={`flex-1 min-w-0 px-6 py-4 text-center font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">تحميل البيانات المحاسبية...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">لوحة التحكم المالية</h2>
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm mb-1">إجمالي الفواتير</p>
                          <p className="text-3xl font-bold">{invoices.length}</p>
                        </div>
                        <div className="text-4xl">📄</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm mb-1">إجمالي المبيعات</p>
                          <p className="text-3xl font-bold">
                            {invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="text-4xl">💵</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm mb-1">إجمالي الديون</p>
                          <p className="text-3xl font-bold">
                            {debts.reduce((sum, debt) => sum + (debt.total_amount || 0), 0).toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="text-4xl">💳</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm mb-1">إجمالي التحصيل</p>
                          <p className="text-3xl font-bold">
                            {collections.reduce((sum, col) => sum + (col.amount || 0), 0).toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="text-4xl">💰</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">آخر الفواتير</h3>
                      <div className="space-y-3">
                        {invoices.slice(0, 5).map((invoice) => (
                          <div key={invoice.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                            <div>
                              <p className="font-semibold">فاتورة #{invoice.id.slice(-8)}</p>
                              <p className="text-sm text-gray-600">{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{(invoice.total_amount || 0).toLocaleString()} ج.م</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">آخر الديون</h3>
                      <div className="space-y-3">
                        {debts.slice(0, 5).map((debt) => (
                          <div key={debt.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                            <div>
                              <p className="font-semibold">{debt.description}</p>
                              <p className="text-sm text-gray-600">{new Date(debt.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">{(debt.total_amount || 0).toLocaleString()} ج.م</p>
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
                    <h2 className="text-2xl font-bold text-gray-800">إدارة الفواتير</h2>
                    <button
                      onClick={() => setShowCreateInvoiceModal(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center space-x-2 space-x-reverse"
                    >
                      <span>📄</span>
                      <span>إنشاء فاتورة جديدة</span>
                    </button>
                  </div>

                  {/* Invoices List */}
                  <div className="grid gap-6">
                    {invoices.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد فواتير</h3>
                        <p className="text-gray-600">لم يتم إنشاء أي فواتير بعد</p>
                      </div>
                    ) : (
                      invoices.map((invoice) => {
                        const clinic = clinics.find(c => c.id === invoice.clinic_id);
                        const rep = users.find(u => u.id === invoice.rep_id);
                        
                        return (
                          <div key={invoice.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-800">فاتورة #{invoice.id.slice(-8)}</h4>
                                <p className="text-gray-600">🏥 {clinic?.clinic_name || 'عيادة غير محددة'}</p>
                                <p className="text-gray-600">👨‍⚕️ {clinic?.doctor_name || 'طبيب غير محدد'}</p>
                                <p className="text-gray-600">👤 المندوب: {rep?.full_name || 'مندوب غير محدد'}</p>
                                <p className="text-gray-600">📅 {new Date(invoice.created_at).toLocaleDateString('ar-EG')}</p>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-3xl font-bold text-green-600 mb-2">
                                  {(invoice.total_amount || 0).toLocaleString()} ج.م
                                </p>
                                <div className="space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => printInvoice(invoice)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                                  >
                                    🖨️ طباعة
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowInvoiceDetailsModal(true);
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                                  >
                                    👁️ عرض
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">عدد الأصناف:</span>
                                  <span className="font-bold mr-2">{invoice.items?.length || 0}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">المجموع الفرعي:</span>
                                  <span className="font-bold mr-2">{(invoice.subtotal || 0).toLocaleString()} ج.م</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">الخصم:</span>
                                  <span className="font-bold mr-2 text-orange-600">{(invoice.discount_amount || 0).toLocaleString()} ج.م</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">أنشأها:</span>
                                  <span className="font-bold mr-2 text-blue-600">{invoice.created_by_name || 'غير محدد'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Other tabs will be continued in the next part... */}
              {activeTab !== 'dashboard' && activeTab !== 'invoices' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">قيد التطوير</h3>
                  <p className="text-gray-600">هذا القسم قيد التطوير حالياً</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-8 py-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">إنشاء فاتورة جديدة</h2>
                <button
                  onClick={() => {
                    setShowCreateInvoiceModal(false);
                    resetInvoiceForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العيادة *</label>
                  <select
                    value={invoiceForm.clinic_id}
                    onChange={(e) => setInvoiceForm({...invoiceForm, clinic_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">اختر العيادة</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.clinic_name} - د. {clinic.doctor_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المندوب المسؤول *</label>
                  <select
                    value={invoiceForm.rep_id}
                    onChange={(e) => setInvoiceForm({...invoiceForm, rep_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">اختر المندوب</option>
                    {users.filter(u => u.role === 'medical_rep' || u.role === 'sales_rep').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">شروط الدفع</label>
                  <select
                    value={invoiceForm.payment_terms}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_terms: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">نقدي</option>
                    <option value="credit">آجل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">الأصناف</h3>
                  <button
                    onClick={addItemToInvoice}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                  >
                    ➕ إضافة صنف
                  </button>
                </div>

                <div className="space-y-4">
                  {invoiceForm.items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">المنتج *</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateInvoiceItem(index, 'product_id', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">اختر المنتج</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {(product.price || 0).toLocaleString()} ج.م
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الكمية *</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">سعر الوحدة</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الإجمالي</label>
                          <input
                            type="text"
                            value={`${item.total_price.toLocaleString()} ج.م`}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>

                        <div>
                          <button
                            onClick={() => removeInvoiceItem(index)}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Section */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">الخصم</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخصم</label>
                    <select
                      value={invoiceForm.discount_type}
                      onChange={(e) => {
                        setInvoiceForm({...invoiceForm, discount_type: e.target.value, discount_value: 0});
                        calculateInvoiceTotal({...invoiceForm, discount_type: e.target.value, discount_value: 0});
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ج.م)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قيمة الخصم {invoiceForm.discount_type === 'percentage' ? '(%)' : '(ج.م)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoiceForm.discount_type === 'percentage' ? 100 : invoiceForm.subtotal}
                      value={invoiceForm.discount_value}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setInvoiceForm({...invoiceForm, discount_value: value});
                        calculateInvoiceTotal({...invoiceForm, discount_value: value});
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ الخصم</label>
                    <input
                      type="text"
                      value={`${(invoiceForm.discount_amount || 0).toLocaleString()} ج.م`}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="bg-indigo-50 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">المجموع الفرعي</p>
                    <p className="text-xl font-bold text-gray-800">{(invoiceForm.subtotal || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">إجمالي الخصم</p>
                    <p className="text-xl font-bold text-orange-600">-{(invoiceForm.discount_amount || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">المبلغ الإجمالي</p>
                    <p className="text-3xl font-bold text-green-600">{(invoiceForm.total_amount || 0).toLocaleString()} ج.م</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowCreateInvoiceModal(false);
                    resetInvoiceForm();
                  }}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                  disabled={!invoiceForm.clinic_id || !invoiceForm.rep_id || invoiceForm.items.length === 0}
                >
                  📄 إنشاء الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProfessionalAccountingSystem;