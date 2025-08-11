// Enhanced Create Order Modal - مودال إنشاء طلبية محسن للمناديب
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateOrderModal = ({ onClose, onOrderCreated, user, language = 'ar' }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    warehouse_id: '',
    items: [],
    notes: '',
    priority: 'normal'
  });
  
  const [availableClinics, setAvailableClinics] = useState([]);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    product_name: '',
    quantity: 1,
    unit: ''
  });

  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // تحميل العيادات المخصصة للمندوب فقط
      let clinicsResponse;
      if (user?.role === 'medical_rep') {
        // فلترة العيادات حسب المنطقة والخط المخصص للمندوب
        clinicsResponse = await axios.get(`${API}/clinics?rep_id=${user.id}`, { headers });
      } else {
        clinicsResponse = await axios.get(`${API}/clinics`, { headers });
      }

      // تحميل المخازن المخصصة للمستخدم
      const warehousesResponse = await axios.get(`${API}/warehouses`, { headers });
      
      // فلترة المخازن حسب المستخدم
      let userWarehouses = warehousesResponse.data || [];
      if (user?.assigned_warehouse_id) {
        userWarehouses = userWarehouses.filter(w => w.id === user.assigned_warehouse_id);
      }

      // تحميل المنتجات
      const productsResponse = await axios.get(`${API}/products`, { headers });

      setAvailableClinics(clinicsResponse.data || []);
      setAvailableWarehouses(userWarehouses);
      setAvailableProducts(productsResponse.data || []);

      // تعيين المخزن الافتراضي إذا كان هناك مخزن واحد فقط
      if (userWarehouses.length === 1) {
        setFormData(prev => ({ ...prev, warehouse_id: userWarehouses[0].id }));
        loadWarehouseStock(userWarehouses[0].id);
      }

      console.log('✅ Initial data loaded:', {
        clinics: clinicsResponse.data?.length || 0,
        warehouses: userWarehouses.length,
        products: productsResponse.data?.length || 0
      });

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      
      // بيانات وهمية للاختبار
      setAvailableClinics([
        { id: 'clinic-1', name: 'عيادة د. أحمد محمد', area: user?.area, line: user?.line },
        { id: 'clinic-2', name: 'عيادة د. فاطمة سعد', area: user?.area, line: user?.line }
      ]);
      
      setAvailableWarehouses([
        { id: 'warehouse-1', name: 'مخزن القاهرة الرئيسي', location: user?.area }
      ]);
      
      setAvailableProducts([
        { id: 'product-1', name: 'أموكسيسيلين 500mg', unit: 'شريط', category: 'أدوية' },
        { id: 'product-2', name: 'باراسيتامول 500mg', unit: 'علبة', category: 'أدوية' },
        { id: 'product-3', name: 'فيتامين د 1000IU', unit: 'علبة', category: 'مكملات' }
      ]);
      
      if (user?.assigned_warehouse_id) {
        setFormData(prev => ({ ...prev, warehouse_id: 'warehouse-1' }));
      }
    }
  };

  const loadWarehouseStock = async (warehouseId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/warehouses/${warehouseId}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const stockData = {};
      response.data?.forEach(item => {
        stockData[item.product_id] = {
          available_quantity: item.quantity,
          reserved_quantity: item.reserved || 0
        };
      });
      
      setWarehouseStock(stockData);
      console.log('✅ Warehouse stock loaded:', stockData);
    } catch (error) {
      console.error('❌ Error loading warehouse stock:', error);
      // بيانات وهمية للمخزون
      setWarehouseStock({
        'product-1': { available_quantity: 100, reserved_quantity: 10 },
        'product-2': { available_quantity: 250, reserved_quantity: 25 },
        'product-3': { available_quantity: 80, reserved_quantity: 5 }
      });
    }
  };

  const handleWarehouseChange = (warehouseId) => {
    setFormData(prev => ({ ...prev, warehouse_id: warehouseId }));
    if (warehouseId) {
      loadWarehouseStock(warehouseId);
    }
  };

  const handleProductSelect = (product) => {
    setCurrentItem({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit: product.unit || 'قطعة'
    });
  };

  const addItemToOrder = () => {
    if (!currentItem.product_id) {
      setErrors(prev => ({ ...prev, currentItem: 'يرجى اختيار منتج' }));
      return;
    }
    
    if (!currentItem.quantity || currentItem.quantity <= 0) {
      setErrors(prev => ({ ...prev, currentItem: 'يرجى إدخال كمية صالحة' }));
      return;
    }

    // التحقق من توفر المخزون
    const stock = warehouseStock[currentItem.product_id];
    if (stock && currentItem.quantity > stock.available_quantity - stock.reserved_quantity) {
      alert(`الكمية المتاحة: ${stock.available_quantity - stock.reserved_quantity} ${currentItem.unit}`);
      return;
    }

    const newItem = {
      id: Date.now(),
      product_id: currentItem.product_id,
      product_name: currentItem.product_name,
      quantity: parseInt(currentItem.quantity),
      unit: currentItem.unit
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // إعادة تعيين النموذج
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: 1,
      unit: ''
    });

    setErrors(prev => ({ ...prev, currentItem: '' }));
  };

  const removeItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clinic_id) {
      newErrors.clinic_id = 'يرجى اختيار العيادة';
    }
    
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'يرجى اختيار المخزن';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'يرجى إضافة منتج واحد على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const orderData = {
        clinic_id: formData.clinic_id,
        warehouse_id: formData.warehouse_id,
        sales_rep_id: user.id,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit
        })),
        notes: formData.notes,
        priority: formData.priority,
        status: 'pending_accounting'
      };

      console.log('📤 Submitting order:', orderData);

      const response = await axios.post(`${API}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Order created successfully:', response.data);
      
      if (onOrderCreated) {
        onOrderCreated(response.data.order || orderData);
      }
      
      alert('تم إنشاء الطلبية بنجاح!');
      onClose();

    } catch (error) {
      console.error('❌ Error creating order:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      alert(`خطأ في إنشاء الطلبية: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">إنشاء طلبية جديدة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinic Selection - بدون قائمة منسدلة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العيادة *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                  {availableClinics.length > 0 ? (
                    <div className="space-y-2">
                      {availableClinics.map(clinic => (
                        <div key={clinic.id} className="flex items-center">
                          <input
                            type="radio"
                            name="clinic_id"
                            value={clinic.id}
                            checked={formData.clinic_id === clinic.id}
                            onChange={(e) => setFormData(prev => ({ ...prev, clinic_id: e.target.value }))}
                            className="mr-2"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{clinic.name}</div>
                            <div className="text-sm text-gray-500">{clinic.area} - {clinic.line}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">لا توجد عيادات متاحة</div>
                  )}
                </div>
                {errors.clinic_id && <p className="text-red-500 text-sm mt-1">{errors.clinic_id}</p>}
              </div>

              {/* Warehouse Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المخزن *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                  {availableWarehouses.length > 0 ? (
                    <div className="space-y-2">
                      {availableWarehouses.map(warehouse => (
                        <div key={warehouse.id} className="flex items-center">
                          <input
                            type="radio"
                            name="warehouse_id"
                            value={warehouse.id}
                            checked={formData.warehouse_id === warehouse.id}
                            onChange={(e) => handleWarehouseChange(e.target.value)}
                            className="mr-2"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{warehouse.name}</div>
                            <div className="text-sm text-gray-500">{warehouse.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">لا توجد مخازن متاحة</div>
                  )}
                </div>
                {errors.warehouse_id && <p className="text-red-500 text-sm mt-1">{errors.warehouse_id}</p>}
              </div>
            </div>

            {/* Warehouse Stock Status */}
            {formData.warehouse_id && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">حالة المخزون</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {Object.keys(warehouseStock).slice(0, 6).map(productId => {
                    const product = availableProducts.find(p => p.id === productId);
                    const stock = warehouseStock[productId];
                    return (
                      <div key={productId} className="flex justify-between">
                        <span className="text-gray-700">{product?.name || 'منتج غير معروف'}:</span>
                        <span className="font-medium text-blue-700">
                          {(stock.available_quantity - stock.reserved_quantity)} {product?.unit || 'قطعة'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Products Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة المنتجات</h3>
              
              {/* Product Selection - قائمة منسقة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المنتج</label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-gray-50">
                    {availableProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          currentItem.product_id === product.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category} - {product.unit}</div>
                          </div>
                          {warehouseStock[product.id] && (
                            <div className="text-sm text-green-600">
                              متوفر: {(warehouseStock[product.id].available_quantity - warehouseStock[product.id].reserved_quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <div className="text-xs text-gray-500 mt-1">{currentItem.unit}</div>
                  
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    disabled={!currentItem.product_id}
                    className="w-full mt-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    إضافة للطلبية
                  </button>
                </div>
              </div>
              
              {errors.currentItem && <p className="text-red-500 text-sm">{errors.currentItem}</p>}
            </div>

            {/* Order Items List */}
            {formData.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">المنتجات المطلوبة ({formData.items.length})</h3>
                <div className="space-y-2">
                  {formData.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          الكمية: {item.quantity} {item.unit}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">منخفضة</option>
                  <option value="normal">عادية</option>
                  <option value="high">عالية</option>
                  <option value="urgent">طارئة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || formData.items.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جارٍ الإرسال...
                  </>
                ) : (
                  'إنشاء الطلبية'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;