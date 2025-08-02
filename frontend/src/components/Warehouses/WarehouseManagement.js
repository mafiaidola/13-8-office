// Enhanced Warehouse Management Component - إدارة المخازن المحسنة المطورة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const WarehouseManagement = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
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
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  // Egyptian regions configuration
  const egyptianRegions = [
    { id: 'cairo_greater', name: 'القاهرة الكبرى', cities: ['القاهرة', 'الجيزة', 'القليوبية'] },
    { id: 'alexandria', name: 'الإسكندرية', cities: ['الإسكندرية', 'البحيرة', 'مطروح'] },
    { id: 'delta', name: 'الدلتا', cities: ['الدقهلية', 'الشرقية', 'كفر الشيخ', 'الغربية'] },
    { id: 'canal', name: 'قناة السويس', cities: ['الإسماعيلية', 'بورسعيد', 'السويس'] },
    { id: 'upper_egypt', name: 'صعيد مصر', cities: ['أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'] },
    { id: 'sinai', name: 'سيناء', cities: ['شمال سيناء', 'جنوب سيناء'] }
  ];

  // Sample products for warehouse inventory
  const availableProducts = [
    { id: 'prod-001', name: 'أموكسيسيلين 500mg', unit: 'ڤايل', category: 'مضادات حيوية' },
    { id: 'prod-002', name: 'فيتامين د3', unit: 'علبة', category: 'فيتامينات' },
    { id: 'prod-003', name: 'أنسولين طويل المفعول', unit: 'قلم', category: 'هرمونات' },
    { id: 'prod-004', name: 'مسكن للألم', unit: 'شريط', category: 'مسكنات' },
    { id: 'prod-005', name: 'مضاد التهاب', unit: 'علبة', category: 'مضادات التهاب' },
    { id: 'prod-006', name: 'شراب السعال', unit: 'زجاجة', category: 'أدوية الجهاز التنفسي' },
    { id: 'prod-007', name: 'كريم موضعي', unit: 'أنبوبة', category: 'أدوية موضعية' },
    { id: 'prod-008', name: 'قطرة للعين', unit: 'عبوة', category: 'أدوية العيون' }
  ];

  useEffect(() => {
    fetchWarehouseData();
    fetchRegions();
    fetchAvailableManagers();
  }, []);

  const fetchRegions = () => {
    setRegions(egyptianRegions);
  };

  const fetchAvailableManagers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // In real implementation, this would fetch users with accounting or warehouse_manager roles
      const response = await axios.get(`${API}/users?role=accounting,warehouse_manager`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      // Mock data for development
      setAvailableManagers([
        { id: 'user-001', full_name: 'أحمد محمد الحسابات', role: 'accounting', department: 'المحاسبة' },
        { id: 'user-002', full_name: 'سارة أحمد أمينة المخزن', role: 'warehouse_manager', department: 'المخازن' },
        { id: 'user-003', full_name: 'محمد علي المسؤول المالي', role: 'accounting', department: 'المحاسبة' },
        { id: 'user-004', full_name: 'فاطمة سعد مديرة المخزن', role: 'warehouse_manager', department: 'المخازن' }
      ]);
    }
  };

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Enhanced mock data for development
      setWarehouses([
        { 
          id: 'WH_CAIRO', 
          name: 'مخزن القاهرة الرئيسي', 
          city: 'القاهرة', 
          regions: ['cairo_greater', 'delta'], // Multiple regions
          region_names: ['القاهرة الكبرى', 'الدلتا'],
          managers: ['user-001', 'user-002'], // Multiple managers
          manager_names: ['أحمد محمد الحسابات', 'سارة أحمد أمينة المخزن'],
          status: 'active',
          products_inventory: {
            'prod-001': { quantity: 150, min_quantity: 20, max_quantity: 300 },
            'prod-002': { quantity: 80, min_quantity: 15, max_quantity: 200 },
            'prod-003': { quantity: 45, min_quantity: 10, max_quantity: 100 },
            'prod-004': { quantity: 200, min_quantity: 50, max_quantity: 500 }
          },
          created_at: '2024-01-01T00:00:00Z'
        },
        { 
          id: 'WH_ALEX', 
          name: 'مخزن الإسكندرية', 
          city: 'الإسكندرية', 
          regions: ['alexandria'], 
          region_names: ['الإسكندرية'],
          managers: ['user-003'],
          manager_names: ['محمد علي المسؤول المالي'],
          status: 'active',
          products_inventory: {
            'prod-001': { quantity: 90, min_quantity: 20, max_quantity: 200 },
            'prod-002': { quantity: 120, min_quantity: 25, max_quantity: 250 },
            'prod-005': { quantity: 65, min_quantity: 15, max_quantity: 150 }
          },
          created_at: '2024-01-05T00:00:00Z'
        },
        { 
          id: 'WH_GIZA', 
          name: 'مخزن الجيزة', 
          city: 'الجيزة', 
          regions: ['cairo_greater'], 
          region_names: ['القاهرة الكبرى'],
          managers: ['user-002', 'user-004'],
          manager_names: ['سارة أحمد أمينة المخزن', 'فاطمة سعد مديرة المخزن'],
          status: 'maintenance',
          products_inventory: {
            'prod-003': { quantity: 25, min_quantity: 10, max_quantity: 80 },
            'prod-004': { quantity: 180, min_quantity: 50, max_quantity: 400 },
            'prod-006': { quantity: 95, min_quantity: 20, max_quantity: 200 }
          },
          created_at: '2024-01-10T00:00:00Z'
        }
      ]);

      setProducts(availableProducts);

      // Calculate enhanced stats
      const totalWarehouses = 3;
      const totalProducts = availableProducts.length;
      const activeWarehouses = 2;
      
      setWarehouseStats({
        totalWarehouses,
        totalProducts,
        activeWarehouses,
        totalManagers: 4,
        totalRegionsCovered: 3
      });

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
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
        <EnhancedWarehouseDashboard 
          stats={warehouseStats}
          warehouses={warehouses}
          products={products}
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
        />
      )}

      {activeTab === 'inventory' && (
        <EnhancedInventoryManagement 
          warehouses={warehouses}
          products={products}
          onRefresh={fetchWarehouseData}
          language={language}
          user={user}
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

      {/* Enhanced Modals */}
      {showAddWarehouseModal && (
        <EnhancedAddWarehouseModal
          onClose={() => setShowAddWarehouseModal(false)}
          onSave={(data) => {
            console.log('Adding enhanced warehouse:', data);
            setSuccess('تم إضافة المخزن بنجاح مع جميع التفاصيل');
            setShowAddWarehouseModal(false);
            fetchWarehouseData();
          }}
          regions={regions}
          availableManagers={availableManagers}
          products={products}
          language={language}
        />
      )}

      {showEditWarehouseModal && selectedWarehouse && (
        <EnhancedEditWarehouseModal
          warehouse={selectedWarehouse}
          onClose={() => setShowEditWarehouseModal(false)}
          onSave={(data) => {
            console.log('Editing enhanced warehouse:', data);
            setSuccess('تم تحديث المخزن بنجاح');
            setShowEditWarehouseModal(false);
            fetchWarehouseData();
          }}
          regions={regions}
          availableManagers={availableManagers}
          products={products}
          language={language}
        />
      )}
    </div>
  );
};

// Enhanced Warehouse Dashboard Component
const EnhancedWarehouseDashboard = ({ 
  stats, 
  warehouses, 
  products,
  loading, 
  language,
  onAddWarehouse,
  onEditWarehouse, 
  onViewDetails,
  getWarehouseStatusColor
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

  const getProductStockStatus = (warehouse, productId) => {
    const inventory = warehouse.products_inventory[productId];
    if (!inventory) return 'none';
    if (inventory.quantity <= inventory.min_quantity) return 'critical';
    if (inventory.quantity <= inventory.min_quantity * 1.5) return 'low';
    return 'good';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500/20 text-green-300';
      case 'low': return 'bg-yellow-500/20 text-yellow-300';
      case 'critical': return 'bg-red-500/20 text-red-300';
      case 'none': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              <p className="text-sm opacity-75 mb-1">إجمالي المنتجات</p>
              <p className="text-3xl font-bold">{stats.totalProducts || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">المخازن النشطة</p>
              <p className="text-3xl font-bold">{stats.activeWarehouses || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">إجمالي المسؤولين</p>
              <p className="text-3xl font-bold">{stats.totalManagers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">المناطق المغطاة</p>
              <p className="text-3xl font-bold">{stats.totalRegionsCovered || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onAddWarehouse}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
        >
          <span>➕</span>
          إضافة مخزن جديد
        </button>
      </div>

      {/* Enhanced Warehouses List with Product Inventory Tables */}
      <div className="grid grid-cols-1 gap-8">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            {/* Warehouse Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{warehouse.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWarehouseStatusColor(warehouse.status)}`}>
                    {warehouse.status === 'active' ? '✅ نشط' : warehouse.status === 'maintenance' ? '🔧 صيانة' : '❌ غير نشط'}
                  </span>
                </div>
                <p className="text-lg opacity-75 mb-1">{warehouse.city}</p>
                
                {/* Regions */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm opacity-60">المناطق:</span>
                  <div className="flex gap-1 flex-wrap">
                    {warehouse.region_names?.map((region, index) => (
                      <span key={index} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Managers */}
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-60">المسؤولين:</span>
                  <div className="flex gap-1 flex-wrap">
                    {warehouse.manager_names?.map((manager, index) => (
                      <span key={index} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                        {manager}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onViewDetails(warehouse)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  📊 التفاصيل
                </button>
                <button
                  onClick={() => onEditWarehouse(warehouse)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  ✏️ تعديل
                </button>
              </div>
            </div>

            {/* Products Inventory Table */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📦</span>
                جدول المنتجات والكميات المتاحة
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-right py-3 px-4 text-white/80 font-medium">المنتج</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الفئة</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الوحدة</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الكمية المتاحة</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الحد الأدنى</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const inventory = warehouse.products_inventory[product.id];
                      const status = getProductStockStatus(warehouse, product.id);
                      
                      return (
                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{product.name}</td>
                          <td className="py-3 px-4 text-white/70">{product.category}</td>
                          <td className="py-3 px-4 text-white/70">{product.unit}</td>
                          <td className="py-3 px-4">
                            {inventory ? (
                              <span className="text-white font-medium">{inventory.quantity}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {inventory ? inventory.min_quantity : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockStatusColor(status)}`}>
                              {status === 'good' ? '✅ جيد' : 
                               status === 'low' ? '⚠️ منخفض' : 
                               status === 'critical' ? '🚨 حرج' : '❌ غير متوفر'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
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

// Enhanced Inventory Management Component
const EnhancedInventoryManagement = ({ warehouses, products, onRefresh, language, user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>📦</span>
          إدارة المخزون المتقدمة
        </h3>
        
        <p className="text-white/70 mb-6">
          عرض شامل لجميع المنتجات في كل مخزن مع إمكانية تحديث الكميات
        </p>

        <div className="space-y-8">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🏭</span>
                {warehouse.name}
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-right py-3 px-4 text-white/80 font-medium">المنتج</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الفئة</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الكمية الحالية</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الحد الأدنى</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const inventory = warehouse.products_inventory[product.id];
                      const status = inventory ? 
                        (inventory.quantity <= inventory.min_quantity ? 'critical' : 
                         inventory.quantity <= inventory.min_quantity * 1.5 ? 'low' : 'good') : 'none';
                      
                      return (
                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{product.name}</td>
                          <td className="py-3 px-4 text-white/70">{product.category}</td>
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">
                              {inventory ? inventory.quantity : 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {inventory ? inventory.min_quantity : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              status === 'good' ? 'bg-green-500/20 text-green-300' :
                              status === 'low' ? 'bg-yellow-500/20 text-yellow-300' :
                              status === 'critical' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {status === 'good' ? '✅ جيد' : 
                               status === 'low' ? '⚠️ منخفض' : 
                               status === 'critical' ? '🚨 حرج' : '❌ غير متوفر'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                // Handle inventory update
                                console.log(`Update inventory for ${product.name} in ${warehouse.name}`);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              تحديث
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Edit Warehouse Modal
const EnhancedEditWarehouseModal = ({ warehouse, onClose, onSave, regions, availableManagers, products, language }) => {
  const [formData, setFormData] = useState({
    name: warehouse.name || '',
    city: warehouse.city || '',
    selectedRegions: warehouse.regions || [],
    selectedManagers: warehouse.managers || [],
    productsInventory: warehouse.products_inventory || {}
  });

  const handleRegionToggle = (regionId) => {
    setFormData(prev => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter(id => id !== regionId)
        : [...prev.selectedRegions, regionId]
    }));
  };

  const handleManagerToggle = (managerId) => {
    setFormData(prev => ({
      ...prev,
      selectedManagers: prev.selectedManagers.includes(managerId)
        ? prev.selectedManagers.filter(id => id !== managerId)
        : [...prev.selectedManagers, managerId]
    }));
  };

  const updateProductInventory = (productId, field, value) => {
    setFormData(prev => ({
      ...prev,
      productsInventory: {
        ...prev.productsInventory,
        [productId]: {
          ...prev.productsInventory[productId],
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...warehouse, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">✏️</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">تعديل المخزن</h3>
                <p className="text-white/70">{warehouse.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">اسم المخزن *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">المدينة *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>
            </div>

            {/* Multiple Regions Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                المناطق المخدومة * 
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regions.map((region) => (
                  <label key={region.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.selectedRegions.includes(region.id)}
                      onChange={() => handleRegionToggle(region.id)}
                      className="w-5 h-5 text-blue-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{region.name}</div>
                      <div className="text-white/60 text-xs">
                        {region.cities.join('، ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Multiple Managers Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                المسؤولين عن المخزن *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableManagers.map((manager) => (
                  <label key={manager.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.selectedManagers.includes(manager.id)}
                      onChange={() => handleManagerToggle(manager.id)}
                      className="w-5 h-5 text-blue-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{manager.full_name}</div>
                      <div className="text-white/60 text-xs flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          manager.role === 'accounting' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {manager.role === 'accounting' ? '💰 محاسبة' : '📦 أمين مخزن'}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-6 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                حفظ التغييرات
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

// Enhanced Add Warehouse Modal with Multiple Regions and Managers
const EnhancedAddWarehouseModal = ({ onClose, onSave, regions, availableManagers, products, language }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    selectedRegions: [],
    selectedManagers: [],
    productsInventory: {}
  });

  // Initialize products inventory with default values
  useEffect(() => {
    const initialInventory = {};
    products.forEach(product => {
      initialInventory[product.id] = {
        quantity: 0,
        min_quantity: 10,
        max_quantity: 500
      };
    });
    setFormData(prev => ({ ...prev, productsInventory: initialInventory }));
  }, [products]);

  const handleRegionToggle = (regionId) => {
    setFormData(prev => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter(id => id !== regionId)
        : [...prev.selectedRegions, regionId]
    }));
  };

  const handleManagerToggle = (managerId) => {
    setFormData(prev => ({
      ...prev,
      selectedManagers: prev.selectedManagers.includes(managerId)
        ? prev.selectedManagers.filter(id => id !== managerId)
        : [...prev.selectedManagers, managerId]
    }));
  };

  const updateProductInventory = (productId, field, value) => {
    setFormData(prev => ({
      ...prev,
      productsInventory: {
        ...prev.productsInventory,
        [productId]: {
          ...prev.productsInventory[productId],
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">🏭</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">إضافة مخزن جديد</h3>
                <p className="text-white/70">إنشاء مخزن جديد مع تحديد المناطق والمسؤولين</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">اسم المخزن *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  placeholder="مثال: مخزن القاهرة الجديد"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">المدينة *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  placeholder="مثال: القاهرة"
                  required
                />
              </div>
            </div>

            {/* Multiple Regions Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                المناطق المخدومة * (يمكن اختيار أكثر من منطقة)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regions.map((region) => (
                  <label key={region.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.selectedRegions.includes(region.id)}
                      onChange={() => handleRegionToggle(region.id)}
                      className="w-5 h-5 text-green-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{region.name}</div>
                      <div className="text-white/60 text-xs">
                        {region.cities.join('، ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {formData.selectedRegions.length === 0 && (
                <p className="text-orange-300 text-xs mt-2">يرجى اختيار منطقة واحدة على الأقل</p>
              )}
            </div>

            {/* Multiple Managers Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                المسؤولين عن المخزن * (الحسابات وأمناء المخازن فقط)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableManagers.map((manager) => (
                  <label key={manager.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.selectedManagers.includes(manager.id)}
                      onChange={() => handleManagerToggle(manager.id)}
                      className="w-5 h-5 text-green-600 rounded border-2 border-white/30"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{manager.full_name}</div>
                      <div className="text-white/60 text-xs flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          manager.role === 'accounting' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {manager.role === 'accounting' ? '💰 محاسبة' : '📦 أمين مخزن'}
                        </span>
                        <span>{manager.department}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {formData.selectedManagers.length === 0 && (
                <p className="text-orange-300 text-xs mt-2">يرجى اختيار مسؤول واحد على الأقل</p>
              )}
            </div>

            {/* Products Inventory Table */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                جدول المنتجات مع الكميات الأولية
              </label>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-h-80 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-right py-2 px-3 text-white/80">المنتج</th>
                        <th className="text-right py-2 px-3 text-white/80">الفئة</th>
                        <th className="text-right py-2 px-3 text-white/80">الوحدة</th>
                        <th className="text-right py-2 px-3 text-white/80">الكمية الأولية</th>
                        <th className="text-right py-2 px-3 text-white/80">الحد الأدنى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-white/5">
                          <td className="py-2 px-3 font-medium text-white">{product.name}</td>
                          <td className="py-2 px-3 text-white/70">{product.category}</td>
                          <td className="py-2 px-3 text-white/70">{product.unit}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={formData.productsInventory[product.id]?.quantity || 0}
                              onChange={(e) => updateProductInventory(product.id, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={formData.productsInventory[product.id]?.min_quantity || 10}
                              onChange={(e) => updateProductInventory(product.id, 'min_quantity', e.target.value)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={formData.selectedRegions.length === 0 || formData.selectedManagers.length === 0}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>💾</span>
                إضافة المخزن
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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