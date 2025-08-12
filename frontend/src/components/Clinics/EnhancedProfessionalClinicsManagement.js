// Enhanced Professional Clinics Management - إدارة العيادات الاحترافية المحسنة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const EnhancedProfessionalClinicsManagement = ({ language = 'ar', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  
  // State Management
  const [clinics, setClinics] = useState([]);
  const [areas, setAreas] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreditStatus, setFilterCreditStatus] = useState('all');
  
  // Selected clinic and modal states
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showClinicProfileModal, setShowClinicProfileModal] = useState(false);
  const [showDebtsReviewModal, setShowDebtsReviewModal] = useState(false);
  const [showCollectionsReviewModal, setShowCollectionsReviewModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Financial Data States
  const [clinicFinancials, setClinicFinancials] = useState({});
  const [overallStats, setOverallStats] = useState({
    total_clinics: 0,
    total_invoices: 0,
    total_debts: 0,
    total_collections: 0,
    total_revenue: 0,
    outstanding_amount: 0,
    collection_rate: 0
  });

  // Form States for Invoice Creation
  const [invoiceForm, setInvoiceForm] = useState({
    clinic_id: '',
    rep_id: user?.id || '',
    items: [],
    subtotal: 0,
    discount_type: 'percentage',
    discount_value: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_terms: 'cash',
    due_date: '',
    notes: '',
    created_by_name: user?.full_name || ''
  });

  // Form States for Debt Creation
  const [debtForm, setDebtForm] = useState({
    clinic_id: '',
    rep_id: user?.id || '',
    description: '',
    items: [],
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: 0,
    due_date: '',
    priority: 'medium',
    category: 'purchase'
  });

  // Form States for Collection Creation
  const [collectionForm, setCollectionForm] = useState({
    invoice_id: '',
    debt_id: '',
    payment_type: 'full',
    amount: 0,
    selected_items: [],
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });

  // Clinic Profile Data
  const [clinicProfileData, setClinicProfileData] = useState({
    overview: {},
    orders: [],
    debts: [],
    visits: [],
    collections: []
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadClinicsData();
    loadSupportingData();
    loadFinancialOverview();
  }, []);

  const loadClinicsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load clinics
      const clinicsResponse = await fetch(`${API_URL}/api/clinics`, { headers });
      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        const clinicsArray = Array.isArray(clinicsData) ? clinicsData : clinicsData.clinics || [];
        setClinics(clinicsArray);

        // Load financial data for each clinic
        await loadClinicFinancials(clinicsArray, headers);
      }

    } catch (error) {
      console.error('Error loading clinics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClinicFinancials = async (clinicsArray, headers) => {
    try {
      const financialsData = {};
      
      for (const clinic of clinicsArray) {
        try {
          // Get clinic profile with financial data
          const profileResponse = await fetch(`${API_URL}/api/clinic-profile/${clinic.id}/overview`, { headers });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            financialsData[clinic.id] = profileData.statistics?.financial || {};
          }

          // Get invoices for this clinic
          const invoicesResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/invoices`, { headers });
          if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            const clinicInvoices = (invoicesData.invoices || []).filter(inv => inv.clinic_id === clinic.id);
            
            if (!financialsData[clinic.id]) financialsData[clinic.id] = {};
            financialsData[clinic.id].invoices_count = clinicInvoices.length;
            financialsData[clinic.id].invoices_amount = clinicInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
          }

          // Get debts for this clinic
          const debtsResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/debts`, { headers });
          if (debtsResponse.ok) {
            const debtsData = await debtsResponse.json();
            const clinicDebts = (debtsData.debts || []).filter(debt => debt.clinic_id === clinic.id);
            
            if (!financialsData[clinic.id]) financialsData[clinic.id] = {};
            financialsData[clinic.id].debts_count = clinicDebts.length;
            financialsData[clinic.id].debts_amount = clinicDebts.reduce((sum, debt) => sum + (debt.total_amount || 0), 0);
            financialsData[clinic.id].overdue_debts = clinicDebts.filter(debt => debt.is_overdue).length;
          }

          // Get collections for this clinic
          const collectionsResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/collections`, { headers });
          if (collectionsResponse.ok) {
            const collectionsData = await collectionsResponse.json();
            const clinicCollections = (collectionsData.collections || []).filter(col => col.clinic_id === clinic.id);
            
            if (!financialsData[clinic.id]) financialsData[clinic.id] = {};
            financialsData[clinic.id].collections_count = clinicCollections.length;
            financialsData[clinic.id].collections_amount = clinicCollections.reduce((sum, col) => sum + (col.amount || 0), 0);
          }

        } catch (error) {
          console.error(`Error loading financial data for clinic ${clinic.id}:`, error);
          financialsData[clinic.id] = {
            invoices_count: 0,
            invoices_amount: 0,
            debts_count: 0,
            debts_amount: 0,
            collections_count: 0,
            collections_amount: 0,
            overdue_debts: 0
          };
        }
      }

      setClinicFinancials(financialsData);
    } catch (error) {
      console.error('Error loading clinic financials:', error);
    }
  };

  const loadSupportingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load areas, products, users
      const [areasResponse, productsResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/api/areas`, { headers }),
        fetch(`${API_URL}/api/products`, { headers }),
        fetch(`${API_URL}/api/users`, { headers })
      ]);

      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(Array.isArray(areasData) ? areasData : areasData.areas || []);
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

  const loadFinancialOverview = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Get overall financial dashboard
      const dashboardResponse = await fetch(`${API_URL}/api/enhanced-professional-accounting/dashboard`, { headers });
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const dashboard = dashboardData.dashboard || {};
        
        setOverallStats({
          total_clinics: clinics.length,
          total_invoices: dashboard.invoices?.total_count || 0,
          total_debts: dashboard.debts?.total_count || 0,
          total_collections: dashboard.collections?.total_count || 0,
          total_revenue: dashboard.invoices?.total_amount || 0,
          outstanding_amount: dashboard.debts?.total_amount || 0,
          collection_rate: dashboard.summary?.collection_ratio || 0
        });
      }

    } catch (error) {
      console.error('Error loading financial overview:', error);
    }
  };

  const loadClinicProfile = async (clinic) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [overviewRes, ordersRes, debtsRes, visitsRes, collectionsRes] = await Promise.all([
        fetch(`${API_URL}/api/clinic-profile/${clinic.id}/overview`, { headers }),
        fetch(`${API_URL}/api/clinic-profile/${clinic.id}/orders`, { headers }),
        fetch(`${API_URL}/api/clinic-profile/${clinic.id}/debts`, { headers }),
        fetch(`${API_URL}/api/clinic-profile/${clinic.id}/visits`, { headers }),
        fetch(`${API_URL}/api/clinic-profile/${clinic.id}/collections`, { headers })
      ]);

      const overview = overviewRes.ok ? await overviewRes.json() : {};
      const orders = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const debts = debtsRes.ok ? await debtsRes.json() : { debts: [] };
      const visits = visitsRes.ok ? await visitsRes.json() : { visits: [] };
      const collections = collectionsRes.ok ? await collectionsRes.json() : { collections: [] };

      setClinicProfileData({
        overview: overview,
        orders: orders.orders || [],
        debts: debts.debts || [],
        visits: visits.visits || [],
        collections: collections.collections || []
      });

    } catch (error) {
      console.error('Error loading clinic profile:', error);
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

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[itemIndex].product_name = product.name;
        updatedItems[itemIndex].unit_price = product.price || 0;
      }
    }

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

  const calculateInvoiceTotal = (formData) => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    let discount_amount = 0;
    
    if (formData.discount_type === 'percentage') {
      discount_amount = (subtotal * formData.discount_value) / 100;
    } else {
      discount_amount = formData.discount_value;
    }

    const total_amount = subtotal - discount_amount;

    setInvoiceForm({
      ...formData,
      subtotal,
      discount_amount,
      total_amount
    });
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clinic_id: '',
      rep_id: user?.id || '',
      items: [],
      subtotal: 0,
      discount_type: 'percentage',
      discount_value: 0,
      discount_amount: 0,
      total_amount: 0,
      payment_terms: 'cash',
      due_date: '',
      notes: '',
      created_by_name: user?.full_name || ''
    });
  };

  const handleCreateInvoice = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/enhanced-professional-accounting/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invoiceForm)
      });

      if (response.ok) {
        const result = await response.json();
        alert('تم إنشاء الفاتورة بنجاح');
        setShowCreateInvoiceModal(false);
        resetInvoiceForm();
        loadClinicsData();
      } else {
        const error = await response.text();
        alert(`خطأ في إنشاء الفاتورة: ${error}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة');
    }
  };

  // Debt Functions
  const addItemToDebt = () => {
    const newItem = {
      id: Date.now(),
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setDebtForm({
      ...debtForm,
      items: [...debtForm.items, newItem]
    });
  };

  const updateDebtItem = (itemIndex, field, value) => {
    const updatedItems = [...debtForm.items];
    updatedItems[itemIndex][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[itemIndex].product_name = product.name;
        updatedItems[itemIndex].unit_price = product.price || 0;
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[itemIndex].total_price = 
        updatedItems[itemIndex].quantity * updatedItems[itemIndex].unit_price;
    }

    setDebtForm({ ...debtForm, items: updatedItems });
    calculateDebtTotal({ ...debtForm, items: updatedItems });
  };

  const removeDebtItem = (itemIndex) => {
    const updatedItems = debtForm.items.filter((_, index) => index !== itemIndex);
    setDebtForm({ ...debtForm, items: updatedItems });
    calculateDebtTotal({ ...debtForm, items: updatedItems });
  };

  const calculateDebtTotal = (formData) => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const discount_amount = (subtotal * formData.discount_percentage) / 100;
    const total_amount = subtotal - discount_amount;

    setDebtForm({
      ...formData,
      subtotal,
      discount_amount,
      total_amount
    });
  };

  const handleCreateDebt = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/enhanced-professional-accounting/debts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(debtForm)
      });

      if (response.ok) {
        const result = await response.json();
        alert('تم إنشاء الدين بنجاح');
        setShowCreateDebtModal(false);
        resetDebtForm();
        loadClinicsData();
      } else {
        const error = await response.text();
        alert(`خطأ في إنشاء الدين: ${error}`);
      }
    } catch (error) {
      console.error('Error creating debt:', error);
      alert('حدث خطأ أثناء إنشاء الدين');
    }
  };

  const resetDebtForm = () => {
    setDebtForm({
      clinic_id: '',
      rep_id: user?.id || '',
      description: '',
      items: [],
      subtotal: 0,
      discount_percentage: 0,
      discount_amount: 0,
      total_amount: 0,
      due_date: '',
      priority: 'medium',
      category: 'purchase'
    });
  };

  const handleCreateCollection = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/enhanced-professional-accounting/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collectionForm)
      });

      if (response.ok) {
        const result = await response.json();
        alert('تم تسجيل التحصيل بنجاح - في انتظار موافقة المدير');
        setShowCollectionModal(false);
        resetCollectionForm();
        loadClinicsData();
      } else {
        const error = await response.text();
        alert(`خطأ في تسجيل التحصيل: ${error}`);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('حدث خطأ أثناء تسجيل التحصيل');
    }
  };

  const resetCollectionForm = () => {
    setCollectionForm({
      invoice_id: '',
      debt_id: '',
      payment_type: 'full',
      amount: 0,
      selected_items: [],
      payment_method: 'cash',
      receipt_number: '',
      notes: ''
    });
  };

  // Filter clinics
  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = clinic.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClassification = filterClassification === 'all' || clinic.classification === filterClassification;
    const matchesArea = filterArea === 'all' || clinic.area_id === filterArea;
    const matchesStatus = filterStatus === 'all' || clinic.is_active?.toString() === filterStatus;
    
    return matchesSearch && matchesClassification && matchesArea && matchesStatus;
  });

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'C': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCreditStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-clinics-management p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white">🏥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">إدارة العيادات الاحترافية</h1>
              <p className="text-lg text-gray-600">نظام شامل لإدارة العيادات مع التكامل المحاسبي الكامل</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              <span>📊</span>
              <span>التحليلات المالية</span>
            </button>
          </div>
        </div>

        {/* Financial Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
          <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
            <div className="text-3xl font-bold">{overallStats.total_clinics}</div>
            <div className="text-blue-100">إجمالي العيادات</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <div className="text-3xl font-bold">{(overallStats.total_revenue || 0).toLocaleString()}</div>
            <div className="text-green-100">إجمالي الإيرادات</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
            <div className="text-3xl font-bold">{(overallStats.outstanding_amount || 0).toLocaleString()}</div>
            <div className="text-red-100">الديون المستحقة</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
            <div className="text-3xl font-bold">{overallStats.total_invoices}</div>
            <div className="text-yellow-100">إجمالي الفواتير</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
            <div className="text-3xl font-bold">{Math.round(overallStats.collection_rate || 0)}%</div>
            <div className="text-purple-100">معدل التحصيل</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🔍 البحث</label>
            <input
              type="text"
              placeholder="ابحث في العيادات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📊 التصنيف</label>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="A">تصنيف A - ممتاز</option>
              <option value="B">تصنيف B - جيد</option>
              <option value="C">تصنيف C - متوسط</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🗺️ المنطقة</label>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المناطق</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">⚡ الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="grid gap-6">
        {filteredClinics.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد عيادات مطابقة</h3>
            <p className="text-gray-600">حاول تعديل معايير البحث للعثور على العيادات</p>
          </div>
        ) : (
          filteredClinics.map((clinic) => {
            const financialData = clinicFinancials[clinic.id] || {};
            const netBalance = (financialData.invoices_amount || 0) + (financialData.collections_amount || 0) - (financialData.debts_amount || 0);
            const collectionRate = financialData.invoices_amount > 0 ? 
              ((financialData.collections_amount || 0) / financialData.invoices_amount * 100) : 0;

            return (
              <div key={clinic.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Clinic Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{clinic.clinic_name}</h3>
                      <p className="text-blue-100 mb-1">👨‍⚕️ {clinic.doctor_name}</p>
                      <p className="text-blue-100 mb-1">📍 {clinic.address}</p>
                      <p className="text-blue-100">📞 {clinic.phone || 'غير متوفر'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-xl border-2 font-bold ${getClassificationColor(clinic.classification)}`}>
                        تصنيف {clinic.classification || 'غير محدد'}
                      </span>
                      <div className="mt-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          clinic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {clinic.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-6 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{(financialData.invoices_amount || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">إجمالي الفواتير ({financialData.invoices_count || 0})</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{(financialData.collections_amount || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">التحصيلات ({financialData.collections_count || 0})</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{(financialData.debts_amount || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">الديون ({financialData.debts_count || 0})</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netBalance.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">الرصيد الصافي</div>
                    </div>
                  </div>

                  {/* Collection Rate */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>معدل التحصيل</span>
                      <span className="font-bold">{Math.round(collectionRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          collectionRate >= 80 ? 'bg-green-500' :
                          collectionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Warning Indicators */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(financialData.overdue_debts || 0) > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                        ⚠️ {financialData.overdue_debts} دين متأخر
                      </span>
                    )}
                    {collectionRate < 50 && financialData.invoices_count > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                        📉 معدل تحصيل ضعيف
                      </span>
                    )}
                    {netBalance < -1000 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                        💰 رصيد سالب
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleViewFinancialDetails(clinic)}
                      className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <span>📊</span>
                      <span>التفاصيل المالية</span>
                    </button>
                    
                    <button
                      onClick={() => handleCreateInvoiceForClinic(clinic)}
                      className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <span>📄</span>
                      <span>إنشاء فاتورة</span>
                    </button>
                    
                    <button
                      onClick={() => handleCreateDebtForClinic(clinic)}
                      className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <span>💳</span>
                      <span>إضافة دين</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Navigate to clinic profile
                        window.open(`/clinic-profile/${clinic.id}`, '_blank');
                      }}
                      className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <span>👁️</span>
                      <span>عرض الملف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Financial Details Modal */}
      {showFinancialModal && selectedClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">التفاصيل المالية - {selectedClinic.clinic_name}</h2>
                <button
                  onClick={() => setShowFinancialModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📊 ملخص مالي</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي الفواتير:</span>
                      <span className="font-bold text-green-600">{(clinicFinancials[selectedClinic.id]?.invoices_amount || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي التحصيلات:</span>
                      <span className="font-bold text-blue-600">{(clinicFinancials[selectedClinic.id]?.collections_amount || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي الديون:</span>
                      <span className="font-bold text-red-600">{(clinicFinancials[selectedClinic.id]?.debts_amount || 0).toLocaleString()} ج.م</span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-bold">الرصيد الصافي:</span>
                      <span className={`font-bold text-xl ${
                        ((clinicFinancials[selectedClinic.id]?.invoices_amount || 0) + (clinicFinancials[selectedClinic.id]?.collections_amount || 0) - (clinicFinancials[selectedClinic.id]?.debts_amount || 0)) >= 0 ? 
                        'text-green-600' : 'text-red-600'
                      }`}>
                        {((clinicFinancials[selectedClinic.id]?.invoices_amount || 0) + (clinicFinancials[selectedClinic.id]?.collections_amount || 0) - (clinicFinancials[selectedClinic.id]?.debts_amount || 0)).toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📈 إحصائيات</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">عدد الفواتير:</span>
                      <span className="font-bold text-indigo-600">{clinicFinancials[selectedClinic.id]?.invoices_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">عدد التحصيلات:</span>
                      <span className="font-bold text-blue-600">{clinicFinancials[selectedClinic.id]?.collections_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">عدد الديون:</span>
                      <span className="font-bold text-red-600">{clinicFinancials[selectedClinic.id]?.debts_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الديون المتأخرة:</span>
                      <span className="font-bold text-orange-600">{clinicFinancials[selectedClinic.id]?.overdue_debts || 0}</span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-bold">معدل التحصيل:</span>
                      <span className="font-bold text-xl text-purple-600">
                        {Math.round(clinicFinancials[selectedClinic.id]?.invoices_amount > 0 ? 
                          ((clinicFinancials[selectedClinic.id]?.collections_amount || 0) / clinicFinancials[selectedClinic.id]?.invoices_amount * 100) : 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center space-x-4 space-x-reverse">
                <button
                  onClick={() => setShowFinancialModal(false)}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for other modals */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-center mb-4">إنشاء فاتورة جديدة</h2>
            <p className="text-center text-gray-600 mb-6">سيتم تطوير هذه الوظيفة قريباً للعيادة: {selectedClinic?.clinic_name}</p>
            <div className="text-center">
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-center mb-4">إضافة دين جديد</h2>
            <p className="text-center text-gray-600 mb-6">سيتم تطوير هذه الوظيفة قريباً للعيادة: {selectedClinic?.clinic_name}</p>
            <div className="text-center">
              <button
                onClick={() => setShowCreateDebtModal(false)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8">
            <h2 className="text-2xl font-bold text-center mb-4">التحليلات المالية الشاملة</h2>
            <p className="text-center text-gray-600 mb-6">سيتم تطوير هذه الوظيفة قريباً لعرض التحليلات المالية الشاملة</p>
            <div className="text-center">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl"
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

export default EnhancedProfessionalClinicsManagement;