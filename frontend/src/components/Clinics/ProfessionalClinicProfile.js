// Professional Clinic Profile - ملف العيادة التفصيلي الاحترافي
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const ProfessionalClinicProfile = ({ language = 'ar', theme = 'dark', user, clinicId }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [clinicData, setClinicData] = useState({
    clinic_info: {},
    statistics: {}
  });
  const [orders, setOrders] = useState([]);
  const [debts, setDebts] = useState([]);
  const [visits, setVisits] = useState([]);
  const [collections, setCollections] = useState([]);

  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Form states
  const [orderForm, setOrderForm] = useState({
    products: [],
    total_amount: 0,
    order_type: 'regular',
    delivery_date: '',
    notes: ''
  });

  const [debtForm, setDebtForm] = useState({
    amount: 0,
    description: '',
    due_date: '',
    priority: 'medium',
    category: 'purchase'
  });

  const [collectionForm, setCollectionForm] = useState({
    amount: 0,
    description: '',
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });

  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  // Get clinic ID from URL if not provided as prop
  const currentClinicId = clinicId || new URLSearchParams(window.location.search).get('clinic_id');

  useEffect(() => {
    if (currentClinicId) {
      loadClinicData();
    }
  }, [currentClinicId, activeTab]);

  const loadClinicData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load overview data
      if (activeTab === 'overview') {
        const response = await fetch(`${API}/clinic-profile/${currentClinicId}/overview`, { headers });
        if (response.ok) {
          const data = await response.json();
          setClinicData(data);
        }
      }

      // Load orders data
      if (activeTab === 'orders') {
        const response = await fetch(`${API}/clinic-profile/${currentClinicId}/orders`, { headers });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      }

      // Load debts data
      if (activeTab === 'debts') {
        const response = await fetch(`${API}/clinic-profile/${currentClinicId}/debts`, { headers });
        if (response.ok) {
          const data = await response.json();
          setDebts(data.debts || []);
        }
      }

      // Load visits data
      if (activeTab === 'visits') {
        const response = await fetch(`${API}/clinic-profile/${currentClinicId}/visits`, { headers });
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visits || []);
        }
      }

      // Load collections data
      if (activeTab === 'collections') {
        const response = await fetch(`${API}/clinic-profile/${currentClinicId}/collections`, { headers });
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections || []);
        }
      }

    } catch (error) {
      console.error('Error loading clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/clinic-profile/${currentClinicId}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderForm)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Record activity
        await comprehensiveActivityService.recordOrderCreation({
          id: data.order.id,
          order_number: data.order.id.slice(-8),
          total_amount: orderForm.total_amount,
          items: orderForm.products,
          status: 'pending'
        });

        setShowOrderModal(false);
        resetOrderForm();
        loadClinicData();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleCreateDebt = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/clinic-profile/${currentClinicId}/debts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(debtForm)
      });

      if (response.ok) {
        setShowDebtModal(false);
        resetDebtForm();
        loadClinicData();
      }
    } catch (error) {
      console.error('Error creating debt:', error);
    }
  };

  const handleCreateCollection = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/clinic-profile/${currentClinicId}/collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(collectionForm)
      });

      if (response.ok) {
        setShowCollectionModal(false);
        resetCollectionForm();
        loadClinicData();
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const handleApproveCollection = async (collectionId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/clinic-profile/collections/${collectionId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadClinicData();
      }
    } catch (error) {
      console.error('Error approving collection:', error);
    }
  };

  const resetOrderForm = () => {
    setOrderForm({
      products: [],
      total_amount: 0,
      order_type: 'regular',
      delivery_date: '',
      notes: ''
    });
  };

  const resetDebtForm = () => {
    setDebtForm({
      amount: 0,
      description: '',
      due_date: '',
      priority: 'medium',
      category: 'purchase'
    });
  };

  const resetCollectionForm = () => {
    setCollectionForm({
      amount: 0,
      description: '',
      payment_method: 'cash',
      receipt_number: '',
      notes: ''
    });
  };

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: '📊' },
    { id: 'orders', name: 'الطلبات الاحترافية', icon: '📦' },
    { id: 'debts', name: 'الديون التفصيلية', icon: '💳' },
    { id: 'visits', name: 'سجل الزيارات', icon: '🚗' },
    { id: 'collections', name: 'التحصيل', icon: '💰' }
  ];

  if (!currentClinicId) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4 text-red-500">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">معرف العيادة مطلوب</h3>
          <p className="text-red-600">يرجى تحديد معرف العيادة لعرض الملف التفصيلي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-clinic-profile min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">🏥</span>
                ملف العيادة التفصيلي
              </h1>
              <p className="text-blue-100 text-lg">
                {clinicData.clinic_info?.clinic_name || 'تحميل البيانات...'}
              </p>
              <p className="text-blue-200 text-sm">
                الدكتور: {clinicData.clinic_info?.doctor_name || 'غير محدد'}
              </p>
            </div>
            
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-blue-100">المندوب المسؤول</p>
                <p className="font-bold text-lg">{clinicData.clinic_info?.rep_name || 'غير محدد'}</p>
                <p className="text-sm text-blue-200">{clinicData.clinic_info?.rep_phone || ''}</p>
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
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-6 py-4 text-center font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
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
                <p className="text-gray-600">تحميل البيانات...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm mb-1">إجمالي الزيارات</p>
                          <p className="text-3xl font-bold">{clinicData.statistics?.visits?.total || 0}</p>
                        </div>
                        <div className="text-4xl">🚗</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm mb-1">إجمالي المبيعات</p>
                          <p className="text-3xl font-bold">{(clinicData.statistics?.financial?.total_sales || 0).toLocaleString()} ج.م</p>
                        </div>
                        <div className="text-4xl">💰</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm mb-1">إجمالي الديون</p>
                          <p className="text-3xl font-bold">{(clinicData.statistics?.financial?.total_debts || 0).toLocaleString()} ج.م</p>
                        </div>
                        <div className="text-4xl">💳</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Statistics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="ml-3 text-2xl">📊</span>
                        إحصائيات الزيارات
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي الزيارات:</span>
                          <span className="font-bold">{clinicData.statistics?.visits?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">زيارات هذا الشهر:</span>
                          <span className="font-bold text-green-600">{clinicData.statistics?.visits?.this_month || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">آخر زيارة:</span>
                          <span className="font-bold text-blue-600">
                            {clinicData.statistics?.visits?.last_visit_date 
                              ? new Date(clinicData.statistics.visits.last_visit_date).toLocaleDateString('ar-EG')
                              : 'لا يوجد'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="ml-3 text-2xl">💼</span>
                        الإحصائيات المالية
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي المبيعات:</span>
                          <span className="font-bold text-green-600">{(clinicData.statistics?.financial?.total_sales || 0).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي التحصيل:</span>
                          <span className="font-bold text-blue-600">{(clinicData.statistics?.financial?.total_collections || 0).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي الديون:</span>
                          <span className="font-bold text-red-600">{(clinicData.statistics?.financial?.total_debts || 0).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-800 font-semibold">الرصيد:</span>
                          <span className={`font-bold ${
                            (clinicData.statistics?.financial?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(clinicData.statistics?.financial?.balance || 0).toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinic Details */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="ml-3 text-2xl">🏥</span>
                      تفاصيل العيادة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-gray-600 text-sm">اسم العيادة</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.clinic_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">اسم الدكتور</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.doctor_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">هاتف العيادة</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.clinic_phone || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">الخط</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.line_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">المنطقة</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.area_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">التصنيف</p>
                        <p className="font-bold text-lg">{clinicData.clinic_info?.classification || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">الطلبات الاحترافية</h2>
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                      <span>➕ إضافة طلب جديد</span>
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد طلبات</h3>
                        <p className="text-gray-600">لم يتم إنشاء أي طلبات لهذه العيادة بعد</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="bg-white border rounded-lg p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">طلب #{order.id.slice(-8)}</h4>
                              <p className="text-gray-600">تاريخ الإنشاء: {new Date(order.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{order.total_amount.toLocaleString()} ج.م</p>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'قيد المراجعة' :
                                 order.status === 'approved' ? 'مُوافق عليه' : 'مرفوض'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>عدد المنتجات: {order.products?.length || 0}</p>
                            <p>نوع الطلب: {order.order_type}</p>
                            {order.notes && <p>ملاحظات: {order.notes}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Debts Tab */}
              {activeTab === 'debts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">الديون التفصيلية</h2>
                    <button
                      onClick={() => setShowDebtModal(true)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                    >
                      <span>➕ إضافة دين جديد</span>
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {debts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">💳</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد ديون</h3>
                        <p className="text-gray-600">لا توجد ديون مسجلة لهذه العيادة</p>
                      </div>
                    ) : (
                      debts.map((debt) => (
                        <div key={debt.id} className={`bg-white border-l-4 rounded-lg p-6 shadow-sm ${
                          debt.is_overdue ? 'border-red-500 bg-red-50' :
                          debt.priority === 'high' ? 'border-orange-500' :
                          'border-gray-300'
                        }`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">{debt.description}</h4>
                              <p className="text-gray-600">تاريخ الاستحقاق: {new Date(debt.due_date).toLocaleDateString('ar-EG')}</p>
                              {debt.is_overdue && (
                                <p className="text-red-600 font-semibold">⚠️ متأخر السداد</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">{debt.amount.toLocaleString()} ج.م</p>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                debt.priority === 'high' ? 'bg-red-100 text-red-800' :
                                debt.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {debt.priority === 'high' ? 'عالي' :
                                 debt.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>الفئة: {debt.category}</p>
                            <p>أنشأه: {debt.creator_name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Visits Tab */}
              {activeTab === 'visits' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">سجل الزيارات المحدث</h2>

                  <div className="grid gap-6">
                    {visits.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🚗</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد زيارات</h3>
                        <p className="text-gray-600">لم يتم تسجيل أي زيارات لهذه العيادة بعد</p>
                      </div>
                    ) : (
                      visits.map((visit) => (
                        <div key={visit.id} className="bg-white border rounded-lg p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">زيارة - {visit.visit_type}</h4>
                              <p className="text-gray-600">التاريخ: {new Date(visit.visit_date).toLocaleDateString('ar-EG')}</p>
                              <p className="text-gray-600">المندوب: {visit.rep_name}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                visit.priority === 'high' ? 'bg-red-100 text-red-800' :
                                visit.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {visit.priority === 'high' ? 'عالي' :
                                 visit.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                            </div>
                          </div>
                          {visit.notes && (
                            <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                              <p><strong>ملاحظات:</strong> {visit.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Collections Tab */}
              {activeTab === 'collections' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">قسم التحصيل</h2>
                    <button
                      onClick={() => setShowCollectionModal(true)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                    >
                      <span>➕ تسجيل تحصيل جديد</span>
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {collections.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">💰</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد تحصيلات</h3>
                        <p className="text-gray-600">لم يتم تسجيل أي تحصيلات لهذه العيادة بعد</p>
                      </div>
                    ) : (
                      collections.map((collection) => (
                        <div key={collection.id} className="bg-white border rounded-lg p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">{collection.description}</h4>
                              <p className="text-gray-600">تاريخ التحصيل: {new Date(collection.created_at).toLocaleDateString('ar-EG')}</p>
                              <p className="text-gray-600">المحصل: {collection.collector_name}</p>
                              <p className="text-gray-600">طريقة الدفع: {collection.payment_method}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{collection.amount.toLocaleString()} ج.م</p>
                              <div className="mt-2">
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  collection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  collection.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {collection.status === 'pending' ? 'في انتظار الموافقة' :
                                   collection.status === 'approved' ? 'مُوافق عليه' : 'مرفوض'}
                                </span>
                                {collection.status === 'pending' && (user?.role === 'admin' || user?.role === 'gm') && (
                                  <button
                                    onClick={() => handleApproveCollection(collection.id)}
                                    className="mr-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                                  >
                                    موافقة
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          {collection.notes && (
                            <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                              <p><strong>ملاحظات:</strong> {collection.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">إضافة طلب جديد</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي المبلغ</label>
                <input
                  type="number"
                  value={orderForm.total_amount}
                  onChange={(e) => setOrderForm({...orderForm, total_amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلب</label>
                <select
                  value={orderForm.order_type}
                  onChange={(e) => setOrderForm({...orderForm, order_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regular">عادي</option>
                  <option value="urgent">عاجل</option>
                  <option value="sample">عينة</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التسليم</label>
                <input
                  type="date"
                  value={orderForm.delivery_date}
                  onChange={(e) => setOrderForm({...orderForm, delivery_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                إضافة الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">إضافة دين جديد</h2>
              <button
                onClick={() => setShowDebtModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                <input
                  type="number"
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({...debtForm, amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <input
                  type="text"
                  value={debtForm.description}
                  onChange={(e) => setDebtForm({...debtForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={debtForm.due_date}
                  onChange={(e) => setDebtForm({...debtForm, due_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <select
                  value={debtForm.priority}
                  onChange={(e) => setDebtForm({...debtForm, priority: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <select
                  value={debtForm.category}
                  onChange={(e) => setDebtForm({...debtForm, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="purchase">مشتريات</option>
                  <option value="service">خدمات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowDebtModal(false)}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateDebt}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                إضافة الدين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">تسجيل تحصيل جديد</h2>
              <button
                onClick={() => setShowCollectionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                <input
                  type="number"
                  value={collectionForm.amount}
                  onChange={(e) => setCollectionForm({...collectionForm, amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <input
                  type="text"
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                <select
                  value={collectionForm.payment_method}
                  onChange={(e) => setCollectionForm({...collectionForm, payment_method: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الإيصال</label>
                <input
                  type="text"
                  value={collectionForm.receipt_number}
                  onChange={(e) => setCollectionForm({...collectionForm, receipt_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={collectionForm.notes}
                  onChange={(e) => setCollectionForm({...collectionForm, notes: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowCollectionModal(false)}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCollection}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
              >
                تسجيل التحصيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalClinicProfile;