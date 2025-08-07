// Enhanced Orders Management Component - إدارة الطلبات المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import CreateOrderModal from './CreateOrderModal';
import axios from 'axios';

const OrdersManagement = ({ user, language, isRTL }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { t } = useTranslation(language);
  const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let url = `${API}/orders`;
      
      // فلترة حسب دور المستخدم
      if (user?.role === 'medical_rep') {
        url += `?rep_id=${user.id}`; // المندوب يرى طلباته فقط
      } else if (user?.role === 'manager') {
        url += `?manager_id=${user.id}`; // المدير يرى طلبات فريقه فقط
      }
      // المخازن والحسابات يرون جميع الطلبات
      
      console.log('🔍 Fetching orders for user role:', user?.role, 'URL:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let ordersData = response.data || [];
      
      // فلترة إضافية في الفرونت إند للأمان
      if (user?.role === 'medical_rep') {
        ordersData = ordersData.filter(order => order.sales_rep_id === user.id);
      } else if (user?.role === 'manager') {
        // فلترة طلبات الفريق حسب المنطقة أو الخط
        ordersData = ordersData.filter(order => 
          order.rep_region === user.area || order.rep_line === user.line
        );
      }
      
      setOrders(ordersData);
      console.log(`✅ Loaded ${ordersData.length} orders for ${user?.role}`);
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      
      // بيانات وهمية محسنة حسب الدور
      const mockOrders = [
        {
          id: 'ORD-001',
          clinic_id: 'clinic-001',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          clinic_region: user?.area || 'القاهرة الكبرى',
          clinic_line: user?.line || 'الخط الأول',
          sales_rep_id: user?.role === 'medical_rep' ? user.id : 'rep-001',
          sales_rep_name: user?.role === 'medical_rep' ? user.full_name : 'محمد أحمد المندوب',
          rep_region: user?.area || 'القاهرة الكبرى',
          rep_line: user?.line || 'الخط الأول',
          warehouse_name: 'مخزن القاهرة الرئيسي',
          total_amount: 1500.00,
          items_count: 5,
          status: 'pending_accounting',
          approval_flow: [
            { stage: 'accounting', status: 'pending', user: null, timestamp: null },
            { stage: 'warehouse', status: 'not_reached', user: null, timestamp: null },
            { stage: 'debt_collection', status: 'not_reached', user: null, timestamp: null }
          ],
          created_at: '2024-01-15T10:30:00Z',
          items: [
            { name: 'أموكسيسيلين 500mg', quantity: 2, unit: 'شريط' },
            { name: 'باراسيتامول 500mg', quantity: 3, unit: 'علبة' },
            { name: 'فيتامين د 1000IU', quantity: 1, unit: 'علبة' }
          ]
        }
      ];
      
      // فلترة البيانات الوهمية حسب الدور
      let filteredMockOrders = mockOrders;
      if (user?.role === 'medical_rep') {
        filteredMockOrders = mockOrders.map(order => ({
          ...order,
          sales_rep_id: user.id,
          sales_rep_name: user.full_name || user.username
        }));
      }
      
      setOrders(filteredMockOrders);
    } finally {
      setLoading(false);
    }
  };

  // التحقق من صلاحيات إنشاء طلب
  const canCreateOrder = () => {
    return user?.role === 'medical_rep' || user?.role === 'key_account';
  };

  // التحقق من صلاحيات عرض الأسعار
  const canViewPrices = () => {
    return user?.role !== 'medical_rep';
  };
        {
          id: 'ORD-002',
          clinic_id: 'clinic-002',
          clinic_name: 'عيادة الدكتورة فاطمة سعد',
          clinic_region: 'الإسكندرية',
          clinic_line: 'خط الإسكندرية الشرقي',
          sales_rep_id: 'rep-002',
          sales_rep_name: 'أحمد محمد السيد',
          rep_region: 'الإسكندرية',
          rep_line: 'خط الإسكندرية الشرقي',
          warehouse_name: 'مخزن الإسكندرية',
          total_amount: 890.00,
          items_count: 3,
          status: 'approved',
          created_at: '2024-01-14T14:20:00Z',
          items: [
            { name: 'أنسولين قصير المفعول', quantity: 1, price: 85.00, total: 85.00 },
            { name: 'مضاد حيوي', quantity: 2, price: 120.00, total: 240.00 },
            { name: 'فيتامين ب12', quantity: 1, price: 565.00, total: 565.00 }
          ]
        },
        {
          id: 'ORD-003',
          clinic_id: 'clinic-003',
          clinic_name: 'عيادة الدكتور علي حسن',
          clinic_region: 'الجيزة',
          clinic_line: 'خط الجيزة الشمالي',
          sales_rep_id: 'rep-003',
          sales_rep_name: 'سارة أحمد محمود',
          rep_region: 'الجيزة',
          rep_line: 'خط الجيزة الشمالي',
          warehouse_name: 'مخزن الجيزة',
          total_amount: 2100.00,
          items_count: 7,
          status: 'pending_accounting',
          created_at: '2024-01-13T09:15:00Z',
          items: [
            { name: 'مضاد التهاب', quantity: 3, price: 200.00, total: 600.00 },
            { name: 'مسكن قوي', quantity: 2, price: 150.00, total: 300.00 },
            { name: 'شراب للأطفال', quantity: 4, price: 80.00, total: 320.00 },
            { name: 'كريم موضعي', quantity: 5, price: 60.00, total: 300.00 },
            { name: 'قطرة للعين', quantity: 2, price: 90.00, total: 180.00 },
            { name: 'أقراص فيتامين', quantity: 3, price: 120.00, total: 360.00 },
            { name: 'مرهم طبي', quantity: 1, price: 40.00, total: 40.00 }
          ]
        },
        {
          id: 'ORD-004',
          clinic_id: 'clinic-004',  
          clinic_name: 'مركز الطب الحديث',
          clinic_region: 'المنصورة',
          clinic_line: 'خط الدقهلية',
          sales_rep_id: 'rep-001',
          sales_rep_name: 'محمد أحمد المندوب',
          rep_region: 'المنصورة',
          rep_line: 'خط الدقهلية',
          warehouse_name: 'مخزن المنصورة',
          total_amount: 750.50,
          items_count: 4,
          status: 'completed',
          created_at: '2024-01-12T16:45:00Z',
          items: [
            { name: 'مضاد حساسية', quantity: 2, price: 95.00, total: 190.00 },
            { name: 'شراب مهدئ', quantity: 1, price: 120.50, total: 120.50 },
            { name: 'كبسولات طبيعية', quantity: 3, price: 80.00, total: 240.00 },
            { name: 'مكمل غذائي', quantity: 1, price: 200.00, total: 200.00 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`${API}/orders/${orderId}/review`, 
        { approved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Order approved:', response.data);
      alert('تم اعتماد الطلبية بنجاح');
      fetchOrders();
    } catch (error) {
      console.error('❌ Error approving order:', error);
      alert('خطأ في اعتماد الطلبية: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (window.confirm('هل أنت متأكد من رفض هذه الطلبية؟')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.patch(`${API}/orders/${orderId}/review`, 
          { approved: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Order rejected:', response.data);
        alert('تم رفض الطلبية');
        fetchOrders();
      } catch (error) {
        console.error('❌ Error rejecting order:', error);
        alert('خطأ في رفض الطلبية: ' + (error.response?.data?.detail || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Order created by admin:', response.data);
      alert('تم إنشاء الطلبية بنجاح وتسجيلها كمديونية في النظام');
      setShowCreateOrderModal(false);
      fetchOrders();
    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert('خطأ في إنشاء الطلبية: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/20 text-yellow-300', text: 'معلق' };
      case 'pending_manager':
        return { color: 'bg-blue-500/20 text-blue-300', text: 'في انتظار المدير' };
      case 'pending_accounting':
        return { color: 'bg-purple-500/20 text-purple-300', text: 'في انتظار المحاسبة' };
      case 'pending_warehouse':
        return { color: 'bg-orange-500/20 text-orange-300', text: 'في انتظار المخزن' };
      case 'approved':
        return { color: 'bg-green-500/20 text-green-300', text: 'معتمد' };
      case 'rejected':
        return { color: 'bg-red-500/20 text-red-300', text: 'مرفوض' };
      case 'completed':
        return { color: 'bg-teal-500/20 text-teal-300', text: 'مكتمل' };
      default:
        return { color: 'bg-gray-500/20 text-gray-300', text: status };
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.sales_rep_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status.includes('pending')).length,
    approved: orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">🛒</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('orders', 'title')}</h1>
              <p className="text-lg opacity-75">إدارة ومراجعة جميع الطلبات مع نظام الموافقات</p>
            </div>
          </div>
          
          {user && ['admin', 'gm', 'warehouse_manager', 'accounting'].includes(user.role) && (
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              {t('orders', 'createOrder')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{orderStats.total}</div>
          <div className="text-sm opacity-75">إجمالي الطلبات</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-yellow-400">{orderStats.pending}</div>
          <div className="text-sm opacity-75">طلبات معلقة</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-green-400">{orderStats.approved}</div>
          <div className="text-sm opacity-75">طلبات معتمدة</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-teal-400">{orderStats.completed}</div>
          <div className="text-sm opacity-75">طلبات مكتملة</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              placeholder="ابحث عن الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">حالة الطلبية</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="pending_manager">في انتظار المدير</option>
              <option value="pending_accounting">في انتظار المحاسبة</option>
              <option value="pending_warehouse">في انتظار المخزن</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">رقم الطلبية</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المندوب</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المخزن</th>
                <th className="px-6 py-4 text-right text-sm font-medium">عدد العناصر</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجمالي</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-300">{order.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.clinic_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.sales_rep_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.warehouse_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-center font-medium">
                        {order.items_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{order.total_amount} ج.م</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm opacity-75">
                      {new Date(order.created_at).toLocaleDateString('ar')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        >
                          عرض
                        </button>
                        
                        {order.status.includes('pending') && (
                          <>
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                            >
                              رفض
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-bold mb-2">لا توجد طلبات</h3>
          <p className="text-gray-600">لم يتم العثور على طلبات مطابقة للبحث</p>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          language={language}
          user={user}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <CreateOrderModal
          onClose={() => setShowCreateOrderModal(false)}
          onSubmit={handleCreateOrder}
          language={language}
          user={user}
        />
      )}
    </div>
  );
};

// Enhanced Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, language, user }) => {
  const statusInfo = {
    'pending': { color: 'bg-yellow-500/20 text-yellow-300', text: 'معلق' },
    'pending_manager': { color: 'bg-blue-500/20 text-blue-300', text: 'في انتظار المدير' },
    'pending_accounting': { color: 'bg-purple-500/20 text-purple-300', text: 'في انتظار المحاسبة' },
    'pending_warehouse': { color: 'bg-orange-500/20 text-orange-300', text: 'في انتظار المخزن' },
    'approved': { color: 'bg-green-500/20 text-green-300', text: 'معتمد' },
    'rejected': { color: 'bg-red-500/20 text-red-300', text: 'مرفوض' },
    'completed': { color: 'bg-teal-500/20 text-teal-300', text: 'مكتمل' }
  };

  const currentStatus = statusInfo[order.status] || { color: 'bg-gray-500/20 text-gray-300', text: order.status };
  
  // Check if user can view prices (accounting role)
  const canViewPrices = user?.role === 'accounting' || user?.role === 'admin' || user?.role === 'gm';
  
  // Mock clinic and rep data (would come from API in real implementation)
  const clinicDetails = {
    id: order.clinic_id || 'clinic-001',
    name: order.clinic_name,
    total_orders: 15,
    total_debt: 2500.00,
    remaining_debt: 1200.00,
    region: order.clinic_region || 'القاهرة الكبرى',
    line: order.clinic_line || 'خط وسط القاهرة'
  };
  
  const repDetails = {
    id: order.sales_rep_id || 'rep-001',
    name: order.sales_rep_name,
    total_orders: 45,
    total_debt: 8500.00,
    remaining_debt: 3200.00,
    region: order.rep_region || 'القاهرة الكبرى',
    line: order.rep_line || 'خط وسط القاهرة'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">🛒</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">تفاصيل الطلبية</h3>
                <p className="text-lg font-medium text-orange-300">{order.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* Top Section: Clinic and Rep Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Clinic Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-white">🏥</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">كارت العيادة</h4>
                  <p className="text-blue-300 font-medium">{clinicDetails.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <div className="text-lg font-bold text-green-300">{clinicDetails.total_orders}</div>
                  <div className="text-xs text-green-200">الطلبيات</div>
                </div>
                <div className="text-center bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <div className="text-lg font-bold text-red-300">{clinicDetails.total_debt.toFixed(2)}ج.م</div>
                  <div className="text-xs text-red-200">المديونيات</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">المنطقة:</span>
                  <span className="text-white font-medium">{clinicDetails.region}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">الخط:</span>
                  <span className="text-white font-medium">{clinicDetails.line}</span>
                </div>
              </div>
            </div>

            {/* Sales Rep Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-white">👤</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">كارت المندوب</h4>
                  <p className="text-purple-300 font-medium">{repDetails.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <div className="text-lg font-bold text-green-300">{repDetails.total_orders}</div>
                  <div className="text-xs text-green-200">الطلبيات</div>
                </div>
                <div className="text-center bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <div className="text-lg font-bold text-red-300">{repDetails.total_debt.toFixed(2)}ج.م</div>
                  <div className="text-xs text-red-200">المديونيات</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">المنطقة:</span>
                  <span className="text-white font-medium">{repDetails.region}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">الخط:</span>
                  <span className="text-white font-medium">{repDetails.line}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                <span>📋</span>
                معلومات الطلبية
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">رقم الطلبية:</span>
                  <span className="font-medium text-white">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">العيادة:</span>
                  <span className="font-medium text-white">{order.clinic_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">المندوب:</span>
                  <span className="font-medium text-white">{order.sales_rep_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">المخزن:</span>
                  <span className="font-medium text-white">{order.warehouse_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">الحالة:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStatus.color}`}>
                    {currentStatus.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                <span>💰</span>
                المعلومات المالية
                {!canViewPrices && (
                  <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-1 rounded-full">
                    🔒 محجوبة
                  </span>
                )}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">عدد العناصر:</span>
                  <span className="font-medium text-white">{order.items_count}</span>
                </div>
                {canViewPrices ? (
                  <div className="flex justify-between">
                    <span className="text-white/70">إجمالي المبلغ:</span>
                    <span className="font-medium text-green-300">{order.total_amount} ج.م</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-white/70">إجمالي المبلغ:</span>
                    <span className="text-orange-300">🔒 متاح للحسابات فقط</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/70">تاريخ الإنشاء:</span>
                  <span className="font-medium text-white">{new Date(order.created_at).toLocaleDateString('ar')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">وقت الإنشاء:</span>
                  <span className="font-medium text-white">{new Date(order.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
              <span>📦</span>
              عناصر الطلبية
              {!canViewPrices && (
                <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-1 rounded-full">
                  🔒 الأسعار محجوبة
                </span>
              )}
            </h4>
            {order.items && order.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-right py-2 text-white/80">المنتج</th>
                      <th className="text-right py-2 text-white/80">الكمية</th>
                      {canViewPrices && (
                        <>
                          <th className="text-right py-2 text-white/80">سعر الوحدة</th>
                          <th className="text-right py-2 text-white/80">الإجمالي</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 font-medium text-white">{item.name}</td>
                        <td className="py-3 text-white">
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                            {item.quantity}
                          </span>
                        </td>
                        {canViewPrices && (
                          <>
                            <td className="py-3 text-green-300">{item.price} ج.م</td>
                            <td className="py-3 font-medium text-green-300">{item.total} ج.م</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {canViewPrices && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-right">
                    <div className="text-lg font-bold text-green-300">
                      إجمالي الطلبية: {order.total_amount} ج.م
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-400">لا توجد تفاصيل عناصر متاحة</p>
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;