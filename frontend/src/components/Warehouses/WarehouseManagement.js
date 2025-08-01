// Enhanced Warehouse Management Component - إدارة المخازن المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const WarehouseManagement = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState({});
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showEditWarehouseModal, setShowEditWarehouseModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  
  const { t } = useTranslation(language);
  const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

  // Egyptian warehouses configuration
  const egyptianWarehouses = [
    { id: 'WH_CAIRO', name: 'مخزن القاهرة', city: 'Cairo', region: 'Greater Cairo' },
    { id: 'WH_ALEX', name: 'مخزن الإسكندرية', city: 'Alexandria', region: 'Alexandria' },
    { id: 'WH_GIZA', name: 'مخزن الجيزة', city: 'Giza', region: 'Greater Cairo' },
    { id: 'WH_MANSOURA', name: 'مخزن المنصورة', city: 'Mansoura', region: 'Dakahlia' },
    { id: 'WH_ASWAN', name: 'مخزن أسوان', city: 'Aswan', region: 'Upper Egypt' }
  ];

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Mock data for development
      setWarehouses([
        { 
          id: 'WH_CAIRO', 
          name: 'مخزن القاهرة الرئيسي', 
          city: 'القاهرة', 
          region: 'القاهرة الكبرى',
          capacity: 5000,
          current_stock: 3200,
          products_count: 156,
          manager: 'أحمد محمد',
          status: 'active'
        },
        { 
          id: 'WH_ALEX', 
          name: 'مخزن الإسكندرية', 
          city: 'الإسكندرية', 
          region: 'الإسكندرية',
          capacity: 3000,
          current_stock: 2100,
          products_count: 89,
          manager: 'محمد أحمد',
          status: 'active'
        },
        { 
          id: 'WH_GIZA', 
          name: 'مخزن الجيزة', 
          city: 'الجيزة', 
          region: 'القاهرة الكبرى',
          capacity: 2500,
          current_stock: 1800,
          products_count: 67,
          manager: 'سارة علي',
          status: 'maintenance'
        }
      ]);

      setWarehouseStats({
        totalWarehouses: 3,
        totalCapacity: 10500,
        totalCurrentStock: 7100,
        totalProducts: 312,
        occupancyRate: 67.6
      });

      setInventory([
        { id: 1, name: 'أموكسيسيلين 500mg', warehouse: 'مخزن القاهرة', stock: 150, min_stock: 20, status: 'good' },
        { id: 2, name: 'فيتامين د3', warehouse: 'مخزن الإسكندرية', stock: 15, min_stock: 25, status: 'low' },
        { id: 3, name: 'أنسولين', warehouse: 'مخزن الجيزة', stock: 5, min_stock: 10, status: 'critical' }
      ]);

      setPendingOrders([
        { id: 'ORD-001', clinic: 'عيادة د.أحمد', warehouse: 'مخزن القاهرة', status: 'pending_warehouse', items: 5, total: 1500 },
        { id: 'ORD-002', clinic: 'عيادة د.فاطمة', warehouse: 'مخزن الإسكندرية', status: 'pending_warehouse', items: 3, total: 890 }
      ]);

      setMovements([
        { id: 1, type: 'inbound', product: 'أموكسيسيلين', quantity: 100, warehouse: 'مخزن القاهرة', date: '2024-01-15', status: 'completed' },
        { id: 2, type: 'outbound', product: 'فيتامين د3', quantity: 50, warehouse: 'مخزن الإسكندرية', date: '2024-01-14', status: 'pending' }
      ]);

    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      setError('خطأ في تحميل بيانات المخازن');
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-300';
      case 'inactive': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500/20 text-green-300';
      case 'low': return 'bg-yellow-500/20 text-yellow-300';
      case 'critical': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const calculateOccupancyRate = (current, capacity) => {
    return ((current / capacity) * 100).toFixed(1);
  };

  return (
    <div className="warehouse-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">🏭</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse', 'title')}</h1>
            <p className="text-lg opacity-75">إدارة شاملة للمخازن والمخزون والطلبات</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          ❌ {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
            { id: 'inventory', label: 'إدارة المخزون', icon: '📦' },
            { id: 'orders', label: 'الطلبات', icon: '🛒' },
            { id: 'movements', label: 'سجل الحركات', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <WarehouseDashboard 
          stats={warehouseStats}
          warehouses={warehouses}
          inventory={inventory}
          loading={loading}
          language={language}
          onAddWarehouse={() => setShowAddWarehouseModal(true)}
          onEditWarehouse={(warehouse) => {
            setSelectedWarehouse(warehouse);
            setShowEditWarehouseModal(true);
          }}
          onViewDetails={(warehouse) => {
            setSelectedWarehouse(warehouse);
            // Add view details logic
          }}
          getWarehouseStatusColor={getWarehouseStatusColor}
          calculateOccupancyRate={calculateOccupancyRate}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryManagement 
          inventory={inventory}
          warehouses={warehouses}
          onRefresh={fetchWarehouseData}
          language={language}
          getStockStatusColor={getStockStatusColor}
        />
      )}

      {activeTab === 'orders' && (
        <WarehouseOrdersManagement 
          orders={pendingOrders}
          onRefresh={fetchWarehouseData}
          language={language}
        />
      )}

      {activeTab === 'movements' && (
        <MovementsLog 
          movements={movements}
          language={language}
        />
      )}

      {/* Modals */}
      {showAddWarehouseModal && (
        <AddWarehouseModal
          onClose={() => setShowAddWarehouseModal(false)}
          onSave={(data) => {
            console.log('Adding warehouse:', data);
            setSuccess('تم إضافة المخزن بنجاح');
            setShowAddWarehouseModal(false);
            fetchWarehouseData();
          }}
          language={language}
        />
      )}

      {showEditWarehouseModal && selectedWarehouse && (
        <EditWarehouseModal
          warehouse={selectedWarehouse}
          onClose={() => setShowEditWarehouseModal(false)}
          onSave={(data) => {
            console.log('Editing warehouse:', data);
            setSuccess('تم تحديث المخزن بنجاح');
            setShowEditWarehouseModal(false);
            fetchWarehouseData();
          }}
          language={language}
        />
      )}
    </div>
  );
};

// Warehouse Dashboard Component
const WarehouseDashboard = ({ 
  stats, 
  warehouses, 
  inventory, 
  loading, 
  language,
  onAddWarehouse,
  onEditWarehouse, 
  onViewDetails,
  getWarehouseStatusColor,
  calculateOccupancyRate 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات المخازن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">إجمالي المخازن</p>
              <p className="text-3xl font-bold">{stats.totalWarehouses || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🏭</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">السعة الإجمالية</p>
              <p className="text-3xl font-bold">{stats.totalCapacity?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">المخزون الحالي</p>
              <p className="text-3xl font-bold">{stats.totalCurrentStock?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">معدل الإشغال</p>
              <p className="text-3xl font-bold">{stats.occupancyRate || 0}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onAddWarehouse}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          إضافة مخزن
        </button>
      </div>

      {/* Warehouses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{warehouse.name}</h3>
                <p className="text-sm opacity-75">{warehouse.city} - {warehouse.region}</p>
                <p className="text-sm opacity-60">المدير: {warehouse.manager}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${getWarehouseStatusColor(warehouse.status)}`}>
                {warehouse.status === 'active' ? 'نشط' : warehouse.status === 'maintenance' ? 'صيانة' : 'غير نشط'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>السعة:</span>
                <span>{warehouse.capacity?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>المخزون الحالي:</span>
                <span>{warehouse.current_stock?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>معدل الإشغال:</span>
                <span>{calculateOccupancyRate(warehouse.current_stock, warehouse.capacity)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>عدد المنتجات:</span>
                <span>{warehouse.products_count}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(warehouse)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                عرض التفاصيل
              </button>
              <button
                onClick={() => onEditWarehouse(warehouse)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                تعديل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span>
          تنبيهات نقص المخزون
        </h3>
        <div className="space-y-3">
          {inventory.filter(item => item.status === 'critical' || item.status === 'low').map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm opacity-75">{item.warehouse}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm">المخزون: {item.stock}</div>
                  <div className="text-xs opacity-60">الحد الأدنى: {item.min_stock}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {item.status === 'critical' ? 'حرج' : 'منخفض'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Placeholder Components for other tabs
const InventoryManagement = ({ inventory, warehouses, onRefresh, language, getStockStatusColor }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📦</div>
    <h3 className="text-xl font-bold mb-2">إدارة المخزون متقدمة</h3>
    <p className="text-gray-600 mb-6">نظام شامل لإدارة المخزون مع تتبع المنتجات</p>
    <div className="space-y-4">
      {inventory.map((item) => (
        <div key={item.id} className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm opacity-75">{item.warehouse}</div>
          </div>
          <span className={`px-3 py-1 rounded ${getStockStatusColor(item.status)}`}>
            {item.stock} / {item.min_stock}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const WarehouseOrdersManagement = ({ orders, onRefresh, language }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🛒</div>
    <h3 className="text-xl font-bold mb-2">إدارة طلبات المخزن</h3>
    <p className="text-gray-600 mb-6">معالجة الطلبات المعلقة في المخازن</p>
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
          <div>
            <div className="font-medium">{order.id}</div>
            <div className="text-sm opacity-75">{order.clinic}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{order.total} ج.م</div>
            <div className="text-sm opacity-75">{order.items} عناصر</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MovementsLog = ({ movements, language }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📋</div>
    <h3 className="text-xl font-bold mb-2">سجل حركات المخزن</h3>
    <p className="text-gray-600 mb-6">تتبع جميع حركات الدخول والخروج</p>
    <div className="space-y-4">
      {movements.map((movement) => (
        <div key={movement.id} className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
          <div>
            <div className="font-medium">{movement.product}</div>
            <div className="text-sm opacity-75">{movement.warehouse}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{movement.type === 'inbound' ? '⬇️' : '⬆️'} {movement.quantity}</div>
            <div className="text-sm opacity-75">{movement.date}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Add Warehouse Modal
const AddWarehouseModal = ({ onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    region: '',
    capacity: '',
    manager: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-md w-full border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">إضافة مخزن جديد</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم المخزن</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المدينة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المنطقة</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">السعة</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المدير</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                إضافة المخزن
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

// Edit Warehouse Modal
const EditWarehouseModal = ({ warehouse, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    name: warehouse.name || '',
    city: warehouse.city || '',
    region: warehouse.region || '',
    capacity: warehouse.capacity || '',
    manager: warehouse.manager || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...warehouse, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-md w-full border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">تعديل المخزن</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم المخزن</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المدينة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المنطقة</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">السعة</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">المدير</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                حفظ التغييرات
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

export default WarehouseManagement;