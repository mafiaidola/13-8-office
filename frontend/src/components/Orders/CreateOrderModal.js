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

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load all required data
      const [clinicsRes, usersRes, warehousesRes, productsRes] = await Promise.all([
        axios.get(`${API}/clinics`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/users`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/warehouses`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/products`, { headers }).catch(() => ({ data: [] }))
      ]);

      setClinics(clinicsRes.data || []);
      setSalesReps((usersRes.data || []).filter(user => user.role === 'medical_rep'));
      setWarehouses(warehousesRes.data || []);
      setProducts(productsRes.data || []);

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      // Set mock data for development
      setClinics([
        { id: 'clinic-001', name: 'عيادة الدكتور أحمد محمد', region: 'القاهرة الكبرى' },
        { id: 'clinic-002', name: 'عيادة الدكتورة فاطمة سعد', region: 'الإسكندرية' },
        { id: 'clinic-003', name: 'عيادة الدكتور علي حسن', region: 'الجيزة' }
      ]);
      
      setSalesReps([
        { id: 'rep-001', full_name: 'محمد أحمد المندوب', area: 'القاهرة الكبرى' },
        { id: 'rep-002', full_name: 'أحمد محمد السيد', area: 'الإسكندرية' },
        { id: 'rep-003', full_name: 'سارة أحمد محمود', area: 'الجيزة' }
      ]);

      setWarehouses([
        { id: 'warehouse-001', name: 'مخزن القاهرة الرئيسي', region: 'القاهرة' },
        { id: 'warehouse-002', name: 'مخزن الإسكندرية', region: 'الإسكندرية' },
        { id: 'warehouse-003', name: 'مخزن الجيزة', region: 'الجيزة' }
      ]);

      setProducts([
        { id: 'prod-001', name: 'أموكسيسيلين 500mg', price: 25.50, category: 'مضادات حيوية' },
        { id: 'prod-002', name: 'فيتامين د3', price: 120.00, category: 'فيتامينات' },
        { id: 'prod-003', name: 'أنسولين طويل المفعول', price: 85.00, category: 'أدوية السكري' },
        { id: 'prod-004', name: 'مسكن للألم', price: 15.00, category: 'مسكنات' },
        { id: 'prod-005', name: 'شراب السعال', price: 45.50, category: 'أدوية الجهاز التنفسي' }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    let updatedItem = { ...currentItem, [name]: value };
    
    if (name === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItem = {
          ...updatedItem,
          product_name: selectedProduct.name,
          price: selectedProduct.price,
          total: selectedProduct.price * updatedItem.quantity
        };
      }
    }
    
    if (name === 'quantity' || name === 'price') {
      updatedItem.total = updatedItem.quantity * updatedItem.price;
    }
    
    setCurrentItem(updatedItem);
  };

  const addItemToOrder = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0) {
      alert(language === 'ar' ? 'يرجى اختيار المنتج والكمية' : 'Please select product and quantity');
      return;
    }

    const newItem = {
      ...currentItem,
      id: Date.now() // temporary ID
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset current item
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: 1,
      price: 0,
      total: 0
    });
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
      newErrors.clinic_id = language === 'ar' ? 'يرجى اختيار العيادة' : 'Please select clinic';
    }
    
    if (!formData.sales_rep_id) {
      newErrors.sales_rep_id = language === 'ar' ? 'يرجى اختيار المندوب' : 'Please select sales rep';
    }
    
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = language === 'ar' ? 'يرجى اختيار المخزن' : 'Please select warehouse';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = language === 'ar' ? 'يرجى إضافة منتج واحد على الأقل' : 'Please add at least one item';
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
      const orderData = {
        ...formData,
        total_amount: formData.items.reduce((sum, item) => sum + item.total, 0),
        items_count: formData.items.length,
        status: 'pending_accounting', // Start with accounting approval
        created_by: user?.id,
        created_by_name: user?.full_name || 'Admin',
        workflow_step: 'accounting_approval'
      };

      await onSubmit(orderData);
      console.log('✅ Order submitted successfully');
      
    } catch (error) {
      console.error('❌ Error submitting order:', error);
      alert(language === 'ar' ? 'خطأ في إنشاء الطلبية' : 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-6xl">
        <div className="modal-header">
          <h3 className="text-2xl font-bold text-primary">
            {language === 'ar' ? 'إنشاء طلبية جديدة' : 'Create New Order'}
          </h3>
          <button 
            onClick={onClose} 
            className="modal-close text-muted hover:text-primary"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Clinic Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'اختيار العيادة' : 'Select Clinic'} *
              </label>
              <select
                name="clinic_id"
                value={formData.clinic_id}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.clinic_id ? 'border-red-500' : 'border-primary'}`}
                disabled={loading}
              >
                <option value="">
                  {language === 'ar' ? 'اختر العيادة...' : 'Select clinic...'}
                </option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.region}
                  </option>
                ))}
              </select>
              {errors.clinic_id && <p className="text-red-400 text-sm mt-1">{errors.clinic_id}</p>}
            </div>

            {/* Sales Rep Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'اختيار المندوب' : 'Select Sales Rep'} *
              </label>
              <select
                name="sales_rep_id"
                value={formData.sales_rep_id}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.sales_rep_id ? 'border-red-500' : 'border-primary'}`}
                disabled={loading}
              >
                <option value="">
                  {language === 'ar' ? 'اختر المندوب...' : 'Select sales rep...'}
                </option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name} - {rep.area}
                  </option>
                ))}
              </select>
              {errors.sales_rep_id && <p className="text-red-400 text-sm mt-1">{errors.sales_rep_id}</p>}
            </div>

            {/* Warehouse Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'اختيار المخزن' : 'Select Warehouse'} *
              </label>
              <select
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${errors.warehouse_id ? 'border-red-500' : 'border-primary'}`}
                disabled={loading}
              >
                <option value="">
                  {language === 'ar' ? 'اختر المخزن...' : 'Select warehouse...'}
                </option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.region}
                  </option>
                ))}
              </select>
              {errors.warehouse_id && <p className="text-red-400 text-sm mt-1">{errors.warehouse_id}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {language === 'ar' ? 'الأولوية' : 'Priority'}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full p-3 border border-primary rounded-lg"
                disabled={loading}
              >
                <option value="normal">{language === 'ar' ? 'عادية' : 'Normal'}</option>
                <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
                <option value="urgent">{language === 'ar' ? 'عاجلة' : 'Urgent'}</option>
              </select>
            </div>
          </div>

          {/* Add Items Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold mb-4 text-primary">
              {language === 'ar' ? 'إضافة المنتجات' : 'Add Products'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  {language === 'ar' ? 'المنتج' : 'Product'}
                </label>
                <select
                  name="product_id"
                  value={currentItem.product_id}
                  onChange={handleItemChange}
                  className="w-full p-3 border border-primary rounded-lg"
                  disabled={loading}
                >
                  <option value="">{language === 'ar' ? 'اختر المنتج...' : 'Select product...'}</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price} ج.م
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                  min="1"
                  className="w-full p-3 border border-primary rounded-lg"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </label>
                <input
                  type="number"
                  name="price"
                  value={currentItem.price}
                  onChange={handleItemChange}
                  step="0.01"
                  className="w-full p-3 border border-primary rounded-lg"
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItemToOrder}
                  className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={loading}
                >
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
            
            {currentItem.total > 0 && (
              <p className="text-sm text-secondary">
                {language === 'ar' ? 'الإجمالي:' : 'Total:'} {currentItem.total.toFixed(2)} ج.م
              </p>
            )}
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                {language === 'ar' ? 'قائمة المنتجات' : 'Products List'}
              </h4>
              
              <div className="bg-white rounded-lg border border-primary overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                      <th className="p-3 text-right">{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
                      <th className="p-3 text-right">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="p-3 text-right">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      <th className="p-3 text-right">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={item.id || index} className="border-t">
                        <td className="p-3">{item.product_name}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.price.toFixed(2)} ج.م</td>
                        <td className="p-3 font-semibold">{item.total.toFixed(2)} ج.م</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                            disabled={loading}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th colSpan="3" className="p-3 text-right">
                        {language === 'ar' ? 'الإجمالي الكلي:' : 'Grand Total:'}
                      </th>
                      <th className="p-3 text-right font-bold text-lg">
                        {totalAmount.toFixed(2)} ج.م
                      </th>
                      <th></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {errors.items && <p className="text-red-400 text-sm mt-1">{errors.items}</p>}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              {language === 'ar' ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-3 border border-primary rounded-lg"
              placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
              disabled={loading}
            />
          </div>
        </form>
        
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
              : (language === 'ar' ? 'إنشاء الطلبية' : 'Create Order')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;