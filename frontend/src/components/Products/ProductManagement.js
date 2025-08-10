// Enhanced Product Management Component - إدارة المنتجات المحسنة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import axios from 'axios';

const ProductManagement = ({ user, language = 'en', theme = 'dark', isRTL }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const isDark = theme === 'dark';
  
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterLine, setFilterLine] = useState('all');
  const [componentError, setComponentError] = useState(null);
  
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  // Check if user can see prices
  const canSeePrices = user && (
    user.role === 'admin' || 
    user.role === 'gm' || 
    user.role === 'accounting' || 
    user.role === 'finance' ||
    ['admin', 'gm', 'accounting', 'finance'].includes(user.role)
  );

  useEffect(() => {
    fetchProducts();
    fetchLines();
    
    console.log('📦 Product Management accessed by:', user?.role, user?.username);
    
    sessionStorage.setItem('previousSection', t('products', 'title'));
  }, []);

  const fetchLines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/lines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLines(response.data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
      setLines([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Mock data for development
      setProducts([
        {
          id: 'prod-001',
          name: 'أموكسيسيلين 500mg',
          description: 'مضاد حيوي واسع المجال',
          brand: 'GSK',
          unit: 'ڤايل',
          line_id: 'line-001',
          line_name: 'خط القاهرة الكبرى',
          price: 25.50,
          price_type: 'per_vial',
          current_stock: 150,
          min_stock: 20,
          is_active: true,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'prod-002',
          name: 'فيتامين د3',
          description: 'مكمل غذائي لتقوية العظام',
          brand: 'Pfizer',
          unit: 'علبة',
          line_id: 'line-002',
          line_name: 'خط الإسكندرية',
          price: 120.00,
          price_type: 'per_box',
          current_stock: 80,
          min_stock: 15,
          is_active: true,
          created_at: '2024-01-02T10:00:00Z'
        },
        {
          id: 'prod-003',
          name: 'أنسولين طويل المفعول',
          description: 'علاج السكري النوع الأول والثاني',
          brand: 'Novartis',
          unit: 'قلم',
          line_id: 'line-001',
          line_name: 'خط القاهرة الكبرى',
          price: 85.00,
          price_type: 'per_pen',
          current_stock: 45,
          min_stock: 10,
          is_active: true,
          created_at: '2024-01-03T10:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Creating product with data:', productData);
      
      const response = await axios.post(`${API}/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Product created successfully:', response.data);
      
      fetchProducts();
      setShowProductModal(false);
      alert(tm('createSuccess'));
    } catch (error) {
      console.error('❌ Error creating product:', error);
      const errorMessage = error.response?.data?.detail || tc('error');
      alert(`${tc('error')}: ${errorMessage}`);
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      const currentProduct = products.find(p => p.id === productId);
      const token = localStorage.getItem('access_token');
      console.log('🔧 Updating product:', productId, 'with data:', productData);
      
      const response = await axios.put(`${API}/products/${productId}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Product updated successfully:', response.data);
      
      fetchProducts();
      setShowProductModal(false);
      alert(tm('updateSuccess'));
    } catch (error) {
      console.error('❌ Error updating product:', error);
      const errorMessage = error.response?.data?.detail || tc('error');
      alert(`${tc('error')}: ${errorMessage}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const productToDelete = products.find(p => p.id === productId);
    
    if (window.confirm(`⚠️ تحذير: سيتم حذف المنتج نهائياً من النظام!\n\nالمنتج: ${productToDelete?.name}\nالكمية الحالية: ${productToDelete?.current_stock || 0}\n\nهل أنت متأكد من المتابعة؟`)) {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔧 Permanently deleting product:', productId);
        
        const response = await axios.delete(`${API}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Product permanently deleted:', response.data);
        
        // تسجيل النشاط
        await activityLogger.logActivity(
          'product_permanent_deletion',
          'حذف منتج نهائياً',
          'product',
          productId,
          productToDelete?.name || `منتج ${productId}`,
          {
            deleted_product_name: productToDelete?.name,
            deleted_product_price: productToDelete?.price,
            deleted_product_unit: productToDelete?.unit,
            stock_at_deletion: productToDelete?.current_stock || 0,
            deletion_type: 'HARD_DELETE',
            deletion_reason: 'حذف نهائي بناءً على طلب المستخدم',
            deleted_by_role: user?.role,
            deletion_timestamp: new Date().toISOString()
          }
        );
        
        fetchProducts();
        alert('✅ تم حذف المنتج نهائياً من النظام');
      } catch (error) {
        console.error('❌ Error permanently deleting product:', error);
        const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء حذف المنتج نهائياً';
        alert(`❌ خطأ في حذف المنتج: ${errorMessage}`);
      }
    }
  };

  // Function to delete test/demo products
  const handleDeleteTestProducts = async () => {
    const testProducts = products.filter(product => 
      product.name?.toLowerCase().includes('test') || 
      product.name?.toLowerCase().includes('demo') ||
      product.name?.includes('تجربة') ||
      product.description?.toLowerCase().includes('test') ||
      product.brand?.toLowerCase().includes('test')
    );

    if (testProducts.length === 0) {
      alert('لا توجد منتجات تجريبية للحذف');
      return;
    }

    if (window.confirm(`⚠️ سيتم حذف ${testProducts.length} منتج تجريبي نهائياً من النظام!\n\nهل أنت متأكد من المتابعة؟`)) {
      let successCount = 0;
      let errorCount = 0;

      for (const product of testProducts) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.delete(`${API}/products/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          console.error(`Error deleting test product ${product.id}:`, error);
          errorCount++;
        }
      }

      fetchProducts(); // Refresh the products list
      alert(`✅ تم حذف ${successCount} منتج تجريبي بنجاح${errorCount > 0 ? `\n❌ فشل حذف ${errorCount} منتج` : ''}`);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || product.brand === filterBrand;
    const matchesLine = filterLine === 'all' || product.line_id === filterLine;
    
    return matchesSearch && matchesBrand && matchesLine;
  });

  // Get unique brands
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const getStockStatus = (product) => {
    if (product.current_stock <= product.min_stock) return 'critical';
    if (product.current_stock <= product.min_stock * 2) return 'low';
    return 'good';
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'low': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  const getPriceTypeLabel = (priceType) => {
    const labels = {
      'per_vial': 'سعر الڤايل',
      'per_box': 'سعر العلبة',
      'per_pen': 'سعر القلم',
      'per_tube': 'سعر الأنبوب',
      'per_bottle': 'سعر الزجاجة'
    };
    return labels[priceType] || 'سعر الوحدة';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">📦</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('products', 'title')}</h1>
              <p className="text-lg opacity-75">إدارة شاملة للمنتجات مع التحكم في الأسعار والمخزون</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedProduct(null);
                setShowProductModal(true);
                console.log('🔧 Opening product modal for new product');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
            >
              <span>➕</span>
              إضافة منتج جديد
            </button>
            
            <button
              onClick={handleDeleteTestProducts}
              className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
              title="حذف جميع المنتجات التجريبية"
            >
              <span>🗑️</span>
              حذف المنتجات التجريبية
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-sm opacity-75">إجمالي المنتجات</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
          <div className="text-sm opacity-75">منتجات نشطة</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{products.filter(p => getStockStatus(p) === 'critical').length}</div>
          <div className="text-sm opacity-75">مخزون حرج</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{brands.length}</div>
          <div className="text-sm opacity-75">العلامات التجارية</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              placeholder="ابحث عن المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">العلامة التجارية</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع العلامات التجارية</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">الخط</label>
            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع الخطوط</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">المنتج</th>
                <th className="px-6 py-4 text-right text-sm font-medium">العلامة التجارية</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الخط</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الوحدة</th>
                {canSeePrices && (
                  <th className="px-6 py-4 text-right text-sm font-medium">السعر</th>
                )}
                <th className="px-6 py-4 text-right text-sm font-medium">المخزون</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm opacity-75">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                        {product.brand || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {product.line_name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                        {product.unit}
                      </span>
                    </td>
                    {canSeePrices && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{product.price} ج.م</span>
                          <span className="text-xs opacity-60">
                            {getPriceTypeLabel(product.price_type)}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div className={`inline-block px-3 py-1 rounded-lg border text-center ${getStockColor(stockStatus)}`}>
                        <div className="font-medium">{product.current_stock}</div>
                        <div className="text-xs">الحد الأدنى: {product.min_stock}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        product.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
          <p className="text-gray-600">لم يتم العثور على منتجات مطابقة للبحث</p>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          lines={lines}
          onClose={() => setShowProductModal(false)}
          onSave={selectedProduct ? 
            (data) => handleUpdateProduct(selectedProduct.id, data) : 
            handleCreateProduct
          }
          language={language}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, lines, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    brand: product?.brand || '',
    unit: product?.unit || 'ڤايل',
    line_id: product?.line_id || '',
    price: product?.price || '',
    price_type: product?.price_type || 'per_vial',
    current_stock: product?.current_stock || '',
    min_stock: product?.min_stock || 10,
    is_active: product?.is_active !== undefined ? product.is_active : true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields
    const processedData = {
      ...formData,
      price: parseFloat(formData.price),
      current_stock: parseInt(formData.current_stock),
      min_stock: parseInt(formData.min_stock)
    };
    
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">اسم المنتج *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">العلامة التجارية *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="GSK، Pfizer، Novartis، إلخ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الخط</label>
                <select
                  name="line_id"
                  value={formData.line_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">اختر الخط</option>
                  {lines.map(line => (
                    <option key={line.id} value={line.id}>{line.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وحدة القياس *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="ڤايل">ڤايل</option>
                  <option value="علبة">علبة</option>
                  <option value="قلم">قلم</option>
                  <option value="أنبوب">أنبوب</option>
                  <option value="زجاجة">زجاجة</option>
                  <option value="كيس">كيس</option>
                  <option value="شريط">شريط</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">السعر (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نوع السعر</label>
                <select
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="per_vial">سعر الڤايل</option>
                  <option value="per_box">سعر العلبة</option>
                  <option value="per_pen">سعر القلم</option>
                  <option value="per_tube">سعر الأنبوب</option>
                  <option value="per_bottle">سعر الزجاجة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الكمية الحالية</label>
                <input
                  type="number"
                  name="current_stock"
                  value={formData.current_stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الحد الأدنى للمخزون</label>
                <input
                  type="number"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="وصف تفصيلي للمنتج..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                منتج نشط
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                {product ? 'تحديث المنتج' : 'إضافة المنتج'}
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

export default ProductManagement;