// Enhanced Orders Management Component - إدارة الطلبات المحسنة مع صلاحيات
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
  const API = process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001/api';

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
          total_amount: user?.role === 'medical_rep' ? null : 1500.00, // إخفاء السعر من المندوب
          items_count: 5,
          status: 'pending_accounting',
          approval_flow: [
            { stage: 'accounting', status: 'pending', user: null, timestamp: null },
            { stage: 'warehouse', status: 'not_reached', user: null, timestamp: null },
            { stage: 'debt_collection', status: 'not_reached', user: null, timestamp: null }
          ],
          created_at: '2024-01-15T10:30:00Z',
          items: [
            { name: 'أموكسيسيلين 500mg', quantity: 2, unit: 'شريط', price: user?.role !== 'medical_rep' ? 25.50 : null },
            { name: 'باراسيتامول 500mg', quantity: 3, unit: 'علبة', price: user?.role !== 'medical_rep' ? 15.00 : null },
            { name: 'فيتامين د 1000IU', quantity: 1, unit: 'علبة', price: user?.role !== 'medical_rep' ? 120.00 : null }
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

  const handleCreateOrder = () => {
    if (canCreateOrder()) {
      setShowCreateOrderModal(true);
    } else {
      alert('ليس لديك صلاحية لإنشاء طلبات جديدة');
    }
  };

  const handleOrderCreated = (newOrder) => {
    setOrders([newOrder, ...orders]);
    setShowCreateOrderModal(false);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_accounting': 'في انتظار موافقة الحسابات',
      'pending_warehouse': 'في انتظار موافقة المخزن',
      'pending_debt_collection': 'في انتظار التحصيل',
      'approved': 'تم الموافقة',
      'rejected': 'مرفوض',
      'completed': 'مكتمل'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending_accounting': 'bg-yellow-500',
      'pending_warehouse': 'bg-blue-500',
      'pending_debt_collection': 'bg-purple-500',
      'approved': 'bg-green-500',
      'rejected': 'bg-red-500',
      'completed': 'bg-gray-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.sales_rep_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">جارٍ تحميل الطلبات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
            <p className="text-gray-600">
              {user?.role === 'medical_rep' ? 'طلباتك الخاصة' : 
               user?.role === 'manager' ? 'طلبات فريقك' : 
               'جميع الطلبات في النظام'}
            </p>
          </div>
          
          {/* Create Order Button - للمناديب فقط */}
          {canCreateOrder() && (
            <button
              onClick={handleCreateOrder}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              إنشاء طلبية جديدة
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="البحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending_accounting">في انتظار الحسابات</option>
            <option value="pending_warehouse">في انتظار المخزن</option>
            <option value="pending_debt_collection">في انتظار التحصيل</option>
            <option value="approved">موافق عليها</option>
            <option value="rejected">مرفوضة</option>
            <option value="completed">مكتملة</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
            <p className="text-gray-600">
              {canCreateOrder() ? 'ابدأ بإنشاء طلبية جديدة' : 'لا توجد طلبات متاحة حالياً'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-mono text-lg font-bold text-blue-600">#{order.id}</span>
                    <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">العيادة</h4>
                      <p className="text-gray-900">{order.clinic_name}</p>
                      <p className="text-sm text-gray-500">{order.clinic_region} - {order.clinic_line}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">المندوب</h4>
                      <p className="text-gray-900">{order.sales_rep_name}</p>
                      <p className="text-sm text-gray-500">{order.rep_region} - {order.rep_line}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">المخزن</h4>
                      <p className="text-gray-900">{order.warehouse_name}</p>
                      <p className="text-sm text-gray-500">عدد الأصناف: {order.items_count}</p>
                    </div>
                  </div>

                  {/* Order Items - عرض بسيط للمندوب بدون أسعار */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">الأصناف المطلوبة</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {order.items?.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-600 mx-2">×</span>
                            <span className="text-blue-600">{item.quantity} {item.unit || 'قطعة'}</span>
                          </div>
                        ))}
                      </div>
                      {order.items?.length > 3 && (
                        <p className="text-sm text-gray-500 mt-2">
                          و {order.items.length - 3} صنف آخر...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Approval Flow - تدرج الموافقات */}
                  {order.approval_flow && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">تدرج الموافقات</h4>
                      <div className="flex items-center gap-2">
                        {order.approval_flow.map((stage, index) => (
                          <div key={stage.stage} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              stage.status === 'approved' ? 'bg-green-500' :
                              stage.status === 'rejected' ? 'bg-red-500' :
                              stage.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}>
                              {stage.status === 'approved' ? '✓' :
                               stage.status === 'rejected' ? '✕' :
                               stage.status === 'pending' ? '⏳' : index + 1}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {stage.stage === 'accounting' ? 'الحسابات' :
                               stage.stage === 'warehouse' ? 'المخزن' :
                               stage.stage === 'debt_collection' ? 'التحصيل' : stage.stage}
                            </span>
                            {index < order.approval_flow.length - 1 && (
                              <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailsModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    التفاصيل
                  </button>

                  {/* Price Display - للمخولين فقط */}
                  {canViewPrices() && order.total_amount && (
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-sm text-gray-600">إجمالي القيمة</div>
                      <div className="text-lg font-bold text-green-600">
                        {order.total_amount.toFixed(2)} ج.م
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <CreateOrderModal
          onClose={() => setShowCreateOrderModal(false)}
          onOrderCreated={handleOrderCreated}
          user={user}
          language={language}
        />
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.id}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Full Order Details */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-3">معلومات العيادة</h3>
                    <div className="space-y-2">
                      <p><strong>الاسم:</strong> {selectedOrder.clinic_name}</p>
                      <p><strong>المنطقة:</strong> {selectedOrder.clinic_region}</p>
                      <p><strong>الخط:</strong> {selectedOrder.clinic_line}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-3">معلومات المندوب</h3>
                    <div className="space-y-2">
                      <p><strong>الاسم:</strong> {selectedOrder.sales_rep_name}</p>
                      <p><strong>المنطقة:</strong> {selectedOrder.rep_region}</p>
                      <p><strong>الخط:</strong> {selectedOrder.rep_line}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">تفاصيل الأصناف</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full table">
                      <thead>
                        <tr>
                          <th>اسم الصنف</th>
                          <th>الكمية</th>
                          <th>الوحدة</th>
                          {canViewPrices() && <th>السعر</th>}
                          {canViewPrices() && <th>الإجمالي</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-center">{item.unit || 'قطعة'}</td>
                            {canViewPrices() && <td className="text-center">{item.price ? `${item.price.toFixed(2)} ج.م` : '-'}</td>}
                            {canViewPrices() && <td className="text-center">{item.price ? `${(item.price * item.quantity).toFixed(2)} ج.م` : '-'}</td>}
                          </tr>
                        ))}
                      </tbody>
                      {canViewPrices() && selectedOrder.total_amount && (
                        <tfoot>
                          <tr>
                            <td colSpan={canViewPrices() ? "4" : "3"} className="text-right font-bold">الإجمالي:</td>
                            <td className="text-center font-bold">{selectedOrder.total_amount.toFixed(2)} ج.م</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Approval Flow Details */}
                {selectedOrder.approval_flow && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">سجل الموافقات</h3>
                    <div className="space-y-3">
                      {selectedOrder.approval_flow.map((stage, index) => (
                        <div key={stage.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                              stage.status === 'approved' ? 'bg-green-500' :
                              stage.status === 'rejected' ? 'bg-red-500' :
                              stage.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}>
                              {stage.status === 'approved' ? '✓' :
                               stage.status === 'rejected' ? '✕' :
                               stage.status === 'pending' ? '⏳' : index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {stage.stage === 'accounting' ? 'الحسابات' :
                                 stage.stage === 'warehouse' ? 'المخزن' :
                                 stage.stage === 'debt_collection' ? 'التحصيل' : stage.stage}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stage.status === 'approved' ? 'تم الموافقة' :
                                 stage.status === 'rejected' ? 'تم الرفض' :
                                 stage.status === 'pending' ? 'في الانتظار' : 'لم يتم الوصول إليها'}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {stage.user && <div>بواسطة: {stage.user}</div>}
                            {stage.timestamp && (
                              <div>{new Date(stage.timestamp).toLocaleString('ar-EG')}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;