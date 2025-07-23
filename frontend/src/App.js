import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    // Apply theme to document element and body
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    // Force theme variables update
    updateThemeVariables(savedTheme);
  }, []);

  const updateThemeVariables = (currentTheme) => {
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.style.setProperty('--primary-bg', '#ffffff');
      root.style.setProperty('--secondary-bg', '#f8fafc');
      root.style.setProperty('--accent-bg', '#e2e8f0');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--glass-bg', 'rgba(248, 250, 252, 0.8)');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--gradient-dark', 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)');
    } else {
      root.style.setProperty('--primary-bg', '#0f172a');
      root.style.setProperty('--secondary-bg', '#1e293b');
      root.style.setProperty('--accent-bg', '#334155');
      root.style.setProperty('--card-bg', 'rgba(30, 41, 59, 0.95)');
      root.style.setProperty('--glass-bg', 'rgba(15, 23, 42, 0.8)');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--gradient-dark', 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    updateThemeVariables(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      {theme === 'dark' ? 'داكن' : 'فاتح'}
    </button>
  );
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'حدث خطأ في تسجيل الدخول'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="floating">
          <div className="card-modern w-full max-w-md p-8 fade-in-up glass-effect">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 card-gradient-orange rounded-full flex items-center justify-center glow-pulse">
                <span className="text-4xl">🏥</span>
              </div>
              <h1 className="text-4xl font-bold text-gradient mb-3">نظام إدارة المناديب</h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>منصة إدارة المناديب الطبية المتقدمة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 form-modern">
              <div>
                <label>
                  <span className="text-shadow-glow">🧑‍💼 اسم المستخدم</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>

              <div>
                <label>
                  <span className="text-shadow-glow">🔒 كلمة المرور</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>

              {error && (
                <div className="alert-modern alert-error scale-in">
                  <span className="ml-2">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    <span>تسجيل الدخول</span>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="card-gradient-blue p-6 rounded-2xl text-center">
                <h3 className="font-bold mb-3 flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>بيانات التجربة</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">أدمن:</span>
                    <span>admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">مندوب:</span>
                    <span>أنشئ من لوحة الأدمن</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'sales_rep',
    full_name: '',
    phone: '',
    managed_by: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      setError('خطأ في جلب المستخدمين');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إنشاء المستخدم بنجاح');
      setShowCreateUser(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'sales_rep',
        full_name: '',
        phone: '',
        managed_by: ''
      });
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في إنشاء المستخدم');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${userId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('تم تحديث حالة المستخدم');
      fetchUsers();
    } catch (error) {
      setError('خطأ في تحديث حالة المستخدم');
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'أدمن',
      warehouse_manager: 'مدير مخزن',
      manager: 'مدير',
      sales_rep: 'مندوب'
    };
    return roles[role] || role;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h2>
        <button
          onClick={() => setShowCreateUser(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          إضافة مستخدم جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">إضافة مستخدم جديد</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sales_rep">مندوب</option>
                  <option value="manager">مدير</option>
                  <option value="warehouse_manager">مدير مخزن</option>
                  <option value="admin">أدمن</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الدور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                البريد الإلكتروني
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.full_name}
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getRoleText(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`px-3 py-1 rounded text-xs ${
                      user.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Warehouse Management Component
// Enhanced Warehouse Management Component  
const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [movementHistory, setMovementHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchWarehouseStats();
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory(selectedWarehouse);
      fetchMovementHistory(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouseStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/warehouse-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouseStats(response.data);
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const fetchMovementHistory = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses/${warehouseId}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovementHistory(response.data);
    } catch (error) {
      console.error('Error fetching movement history:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
      if (response.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.data[0].id);
      }
    } catch (error) {
      setError('خطأ في جلب المخازن');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      setError('خطأ في جلب المنتجات');
    }
  };

  const fetchInventory = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      setError('خطأ في جلب المخزون');
    }
  };

  const updateInventory = async (productId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/inventory/${selectedWarehouse}/${productId}`, {
        quantity: parseInt(quantity)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم تحديث المخزون بنجاح');
      fetchInventory(selectedWarehouse);
      fetchWarehouseStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تحديث المخزون');
    }
  };

  // Warehouse Dashboard Component
  const WarehouseDashboard = () => (
    <div className="space-y-8 page-transition">
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gradient">لوحة تحكم المخزن</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>إحصائيات ومعلومات شاملة عن المخزن</p>
        </div>
      </div>

      {warehouseStats && (
        <>
          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>المنتجات المتوفرة</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>في المخزن</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-600">{warehouseStats.available_products}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>إجمالي المخازن</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>تحت إدارتك</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-600">{warehouseStats.total_warehouses}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>نقص المخزون</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>منتجات قليلة</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-orange-600">{warehouseStats.low_stock_products}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">📤</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>منتجات مسحوبة</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>هذا الشهر</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-600">{warehouseStats.withdrawn_products}</p>
            </div>
          </div>

          {/* Orders Statistics */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <span style={{ color: 'var(--text-primary)' }}>إحصائيات الطلبات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-2xl font-bold text-green-600">{warehouseStats.orders.today}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات اليوم</div>
              </div>
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold text-blue-600">{warehouseStats.orders.week}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات الأسبوع</div>
              </div>
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold text-purple-600">{warehouseStats.orders.month}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات الشهر</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📊</span>
            لوحة التحكم
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📦</span>
            إدارة المخزن
          </button>
          <button
            onClick={() => setActiveTab('pending-orders')}
            className={`nav-tab ${activeTab === 'pending-orders' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">⏳</span>
            الطلبات المنتظرة
            {pendingOrders.length > 0 && (
              <span className="badge-modern badge-warning mr-2">{pendingOrders.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('warehouse-log')}
            className={`nav-tab ${activeTab === 'warehouse-log' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📋</span>
            سجل المخزن
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <WarehouseDashboard />}
        
        {activeTab === 'inventory' && (
          <div className="space-y-6 page-transition">
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4">إدارة المخزن</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item, index) => (
                  <div key={index} className="glass-effect p-4 rounded-xl">
                    <div className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {item.product_name}
                    </div>
                    <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      الكمية: {item.quantity} {item.product_unit}
                    </div>
                    <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      السعر: {item.product_price} ج.م
                    </div>
                    {item.low_stock && (
                      <div className="text-sm text-red-500 font-bold">⚠️ مخزون قليل</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending-orders' && (
          <div className="space-y-6 page-transition">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">⏳</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gradient">الطلبات المنتظرة</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>طلبات تحتاج إلى المراجعة والتنفيذ</p>
              </div>
            </div>

            <div className="grid gap-6">
              {pendingOrders.map((order) => (
                <div key={order.id} className="card-modern p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>المندوب:</span>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.sales_rep_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>العيادة:</span>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.clinic_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>المبلغ الإجمالي:</span>
                      <p className="font-semibold text-green-600">{order.total_amount} ج.م</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>موافقة المدير:</span>
                      <span className={`badge-modern ${order.manager_approved ? 'badge-success' : 'badge-warning'}`}>
                        {order.manager_approved ? '✅ تمت الموافقة' : '⏳ في الانتظار'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4" style={{ borderColor: 'var(--accent-bg)' }}>
                    <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>المنتجات المطلوبة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 glass-effect rounded-lg">
                          {item.product_image && (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.product_name}</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              الكمية: {item.quantity} {item.product_unit} | السعر: {item.unit_price} ج.م
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'warehouse-log' && (
          <div className="space-y-6 page-transition">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gradient">سجل المخزن</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>سجل جميع حركات المخزن والأدوية</p>
              </div>
            </div>

            {selectedWarehouse && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  اختر المخزن:
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="form-modern w-full max-w-md"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="card-modern overflow-hidden">
              <div className="table-modern">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المنتج</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">نوع الحركة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">السبب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">بواسطة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementHistory.map((movement, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(movement.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {movement.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge-modern ${
                            movement.movement_type === 'IN' ? 'badge-success' : 
                            movement.movement_type === 'OUT' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {movement.movement_type === 'IN' ? '📥 إدخال' : 
                             movement.movement_type === 'OUT' ? '📤 إخراج' : '🔄 تعديل'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {movement.quantity} {movement.product_unit}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {movement.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {movement.created_by_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
              <h3 className="text-lg font-semibold mb-4">إضافة منتج جديد</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السعر</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة</label>
                    <select
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">اختر الوحدة</option>
                      <option value="قطعة">قطعة</option>
                      <option value="علبة">علبة</option>
                      <option value="زجاجة">زجاجة</option>
                      <option value="كيس">كيس</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: أدوية، مكملات، أجهزة"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateProduct(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    إنشاء المنتج
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">{product.price} ريال</span>
                <span className="text-sm text-gray-500">{product.unit}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                الفئة: {product.category}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">إدارة المخزون</h2>

        {/* Warehouse Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">اختر المخزن</label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} - {warehouse.location}
              </option>
            ))}
          </select>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية الحالية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحد الأدنى
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={`${item.warehouse_id}-${item.product_id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_name}
                    <div className="text-xs text-gray-500">{item.product_category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} {item.product_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.minimum_stock} {item.product_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.low_stock
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.low_stock ? 'نقص مخزون' : 'متوفر'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        const newQuantity = prompt('أدخل الكمية الجديدة:', item.quantity);
                        if (newQuantity !== null && !isNaN(newQuantity)) {
                          updateInventory(item.product_id, newQuantity);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      تحديث الكمية
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Reports Component
const ReportsSection = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [usersReport, setUsersReport] = useState(null);
  const [activeReport, setActiveReport] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeReport === 'inventory') {
      fetchInventoryReport();
    } else if (activeReport === 'users') {
      fetchUsersReport();
    }
  }, [activeReport]);

  const fetchInventoryReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المخزون');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return inventoryReport.reduce((total, item) => total + item.total_value, 0).toFixed(2);
  };

  const getLowStockCount = () => {
    return inventoryReport.filter(item => item.low_stock).length;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المخزون
          </button>
          <button
            onClick={() => setActiveReport('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المستخدمين
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل التقرير...</p>
          </div>
        )}

        {/* Inventory Report */}
        {activeReport === 'inventory' && !isLoading && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المخزون الشامل</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي قيمة المخزون</h3>
                <p className="text-2xl font-bold text-blue-600">{getTotalInventoryValue()} ريال</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">منتجات نقص مخزون</h3>
                <p className="text-2xl font-bold text-red-600">{getLowStockCount()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">إجمالي المنتجات</h3>
                <p className="text-2xl font-bold text-green-600">{inventoryReport.length}</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المخزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القيمة الإجمالية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryReport.map((item, index) => (
                    <tr key={index} className={item.low_stock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_value.toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.low_stock
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.low_stock ? 'نقص مخزون' : 'متوفر'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Report */}
        {activeReport === 'users' && !isLoading && usersReport && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المستخدمين</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي المستخدمين</h3>
                <p className="text-2xl font-bold text-blue-600">{usersReport.total_users}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">مستخدمين نشطين</h3>
                <p className="text-2xl font-bold text-green-600">{usersReport.active_distribution.active}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">مستخدمين معطلين</h3>
                <p className="text-2xl font-bold text-red-600">{usersReport.active_distribution.inactive}</p>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الأدوار</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(usersReport.role_distribution).map(([role, count]) => {
                  const roleNames = {
                    admin: 'أدمن',
                    warehouse_manager: 'مدير مخزن',
                    manager: 'مدير',
                    sales_rep: 'مندوب'
                  };
                  return (
                    <div key={role} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">{roleNames[role] || role}</p>
                      <p className="text-xl font-bold text-gray-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersReport.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.full_name}
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.role === 'admin' && 'أدمن'}
                        {user.role === 'warehouse_manager' && 'مدير مخزن'}
                        {user.role === 'manager' && 'مدير'}
                        {user.role === 'sales_rep' && 'مندوب'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Sales Rep Dashboard
const SalesRepDashboard = () => {
  const [detailedStats, setDetailedStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/sales-rep-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetailedStats(response.data);
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Visit Statistics Section */}
      <div className="card-modern p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gradient">قسم الزيارات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card stat-green text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌅</span>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">زيارات اليوم</h3>
            <p className="text-4xl font-bold text-green-600 pulse-gentle">{detailedStats.visits?.today || 0}</p>
          </div>
          <div className="stat-card stat-blue text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">زيارات الأسبوع</h3>
            <p className="text-4xl font-bold text-blue-600 pulse-gentle">{detailedStats.visits?.week || 0}</p>
          </div>
          <div className="stat-card stat-purple text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗓️</span>
            </div>
            <h3 className="text-lg font-semibold text-purple-800 mb-2">زيارات الشهر</h3>
            <p className="text-4xl font-bold text-purple-600 pulse-gentle">{detailedStats.visits?.month || 0}</p>
          </div>
          <div className="stat-card stat-orange text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">إجمالي الزيارات</h3>
            <p className="text-4xl font-bold text-indigo-600 pulse-gentle">{detailedStats.visits?.total || 0}</p>
          </div>
        </div>
      </div>

      {/* General Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">🏥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">إجمالي العيادات المضافة</h3>
              <p className="text-sm text-gray-500">عن طريقك</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">{detailedStats.total_clinics_added || 0}</p>
        </div>

        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">إجمالي الأطباء المسجلين</h3>
              <p className="text-sm text-gray-500">عن طريقك</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-green-600">{detailedStats.total_doctors_added || 0}</p>
        </div>

        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">في انتظار الموافقة</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">👁️</span>زيارات:</span>
              <span className="badge-modern badge-warning">{detailedStats.pending?.visits || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">🏥</span>عيادات:</span>
              <span className="badge-modern badge-info">{detailedStats.pending?.clinic_requests || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">📦</span>أوردرات:</span>
              <span className="badge-modern badge-success">{detailedStats.pending?.orders || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clinic Registration Component
const ClinicRegistration = () => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    doctor_name: '',
    clinic_class: '',
    doctor_address: '',
    clinic_manager_name: '',
    address: '',
    notes: '',
    clinic_image: ''
  });
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Convert coordinates to address (placeholder - will be enhanced with Google Maps)
          try {
            setLocationAddress(`الموقع: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          } catch (error) {
            setLocationAddress(`${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          }
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, clinic_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل العيادة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        doctor_specialty: formData.clinic_class, // Map clinic_class to doctor_specialty for backend
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post(`${API}/clinic-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال طلب تسجيل العيادة بنجاح. في انتظار موافقة المدير');
      setFormData({
        clinic_name: '',
        clinic_phone: '',
        doctor_name: '',
        clinic_class: '',
        doctor_address: '',
        clinic_manager_name: '',
        address: '',
        notes: '',
        clinic_image: ''
      });
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeToggle />
      <div className="card-modern p-8 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">🏥</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">تسجيل عيادة جديدة</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>أضف عيادة طبية جديدة إلى النظام</p>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 form-modern">
          {/* Location Banner */}
          <div className="card-gradient-success p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>الموقع الجغرافي الحالي</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location ? (
                <>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📍</span>
                      <span className="font-bold">الإحداثيات:</span>
                    </div>
                    <p className="text-sm font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🏠</span>
                      <span className="font-bold">العنوان:</span>
                    </div>
                    <p className="text-sm">{locationAddress}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center">
                  <div className="gps-indicator">
                    <span>جاري تحديد الموقع...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Placeholder for Google Maps */}
            <div className="mt-6 h-48 glass-effect rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🗺️</span>
                <p className="font-bold">خريطة Google Maps</p>
                <p className="text-sm opacity-75">سيتم عرض الموقع هنا بعد إضافة مفتاح الخرائط</p>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">🏥 اسم العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                className="w-full"
                placeholder="مثال: عيادة النور الطبية"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📞 رقم العيادة</span>
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                className="w-full"
                placeholder="0501234567"
              />
            </div>
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👨‍⚕️ اسم الطبيب</span>
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                className="w-full"
                placeholder="د. أحمد محمد"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">🏆 تصنيف العيادة</span>
              </label>
              <select
                value={formData.clinic_class}
                onChange={(e) => setFormData({...formData, clinic_class: e.target.value})}
                className="w-full"
                required
              >
                <option value="">اختر تصنيف العيادة</option>
                <option value="A Class">A Class - عيادة درجة أولى</option>
                <option value="B Class">B Class - عيادة درجة ثانية</option>
                <option value="C Class">C Class - عيادة درجة ثالثة</option>
              </select>
            </div>
          </div>

          <div>
            <label>
              <span className="text-shadow-glow">🏠 عنوان الطبيب</span>
            </label>
            <input
              type="text"
              value={formData.doctor_address}
              onChange={(e) => setFormData({...formData, doctor_address: e.target.value})}
              className="w-full"
              placeholder="حي الملز، شارع الملك فهد"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👔 المسؤول عن إدارة العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_manager_name}
                onChange={(e) => setFormData({...formData, clinic_manager_name: e.target.value})}
                className="w-full"
                placeholder="اسم مدير العيادة"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📍 عنوان العيادة</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full"
                placeholder="العنوان الكامل للعيادة"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label>
              <span className="text-shadow-glow">📸 صورة العيادة من الخارج (اختياري)</span>
            </label>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-4 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 transition-colors"
                style={{ 
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--brand-orange)',
                  borderOpacity: 0.3
                }}
              />
              {formData.clinic_image && (
                <div className="mt-4">
                  <img
                    src={formData.clinic_image}
                    alt="صورة العيادة"
                    className="h-48 w-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label>
              <span className="text-shadow-glow">📝 ملاحظات العيادة</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={5}
              className="w-full"
              placeholder="أضف أي ملاحظات مهمة عن العيادة، ساعات العمل، أو معلومات خاصة..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !location}
            className="w-full btn-primary text-xl py-4 neon-glow"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                <span>جاري الإرسال...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span>🚀</span>
                <span>إرسال طلب تسجيل العيادة</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

// Order Creation Component
const OrderCreation = () => {
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orderData, setOrderData] = useState({
    doctor_id: '',
    order_type: 'DEMO',
    warehouse_id: '',
    notes: '',
    items: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show approved doctors
      setDoctors(response.data.filter(doctor => doctor.approved_by));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && !selectedProducts.find(p => p.id === productId)) {
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? {...p, quantity: parseInt(quantity)} : p
    ));
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const doctor = doctors.find(d => d.id === orderData.doctor_id);
      
      const requestData = {
        ...orderData,
        clinic_id: doctor.clinic_id,
        items: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity
        }))
      };

      await axios.post(`${API}/orders`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال الطلبية بنجاح. في انتظار موافقة المدير');
      setOrderData({
        doctor_id: '',
        order_type: 'DEMO',
        warehouse_id: '',
        notes: '',
        items: []
      });
      setSelectedProducts([]);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلبية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">عمل طلبية</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اختيار الطبيب</label>
          <select
            value={orderData.doctor_id}
            onChange={(e) => setOrderData({...orderData, doctor_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلبية</label>
            <select
              value={orderData.order_type}
              onChange={(e) => setOrderData({...orderData, order_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEMO">ديمو (مجاني)</option>
              <option value="SALE">أوردر مدفوع</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المخزن</label>
            <select
              value={orderData.warehouse_id}
              onChange={(e) => setOrderData({...orderData, warehouse_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- اختر المخزن --</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتجات</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addProductToOrder(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر منتج لإضافته --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price} ريال ({product.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المنتجات المختارة</h3>
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.price} ريال / {product.unit}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {(product.price * product.quantity).toFixed(2)} ريال
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">إجمالي الطلبية:</span>
                  <span className="text-xl font-bold text-blue-600">{getTotalAmount().toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الأوردر</label>
          <textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف أي ملاحظات خاصة بالطلبية..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedProducts.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال الطلبية'}
        </button>
      </form>
    </div>
  );
};

const VisitRegistration = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل الزيارة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visits`, {
        doctor_id: selectedDoctor,
        clinic_id: selectedClinic,
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم تسجيل الزيارة بنجاح');
      setSelectedDoctor('');
      setSelectedClinic('');
      setNotes('');
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في تسجيل الزيارة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">تسجيل زيارة جديدة</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر الطبيب
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر العيادة
          </label>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر العيادة --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name} - {clinic.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات الزيارة
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف تفاصيل الزيارة..."
            required
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 ml-2">📍</div>
            <div>
              <p className="text-sm font-medium text-blue-800">الموقع الحالي</p>
              {location ? (
                <p className="text-xs text-blue-600">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-blue-600">جاري تحديد الموقع...</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !location}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التسجيل...' : 'تسجيل الزيارة'}
        </button>
      </form>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchVisits();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'أدمن',
      warehouse_manager: 'مدير مخزن',
      manager: 'مدير',
      sales_rep: 'مندوب'
    };
    return roles[role] || role;
  };

  const canAccessTab = (tabName) => {
    const permissions = {
      users: ['admin', 'warehouse_manager', 'manager'],
      warehouse: ['admin', 'warehouse_manager'],
      visit: ['sales_rep'],
      reports: ['admin', 'warehouse_manager', 'manager']
    };
    
    return permissions[tabName]?.includes(user.role) || false;
  };

  return (
    <>
      <ThemeToggle />
      <div className="min-h-screen page-transition">
        {/* Header */}
        <header className="header-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
                  <span className="text-3xl">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient">نظام إدارة المناديب</h1>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>مرحباً، {user.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎭</span>
                      <span className="badge-modern badge-info">{getRoleText(user.role)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-warning flex items-center gap-2"
              >
                <span>🚪</span>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4 overflow-x-auto bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📊</span>
              لوحة التحكم
            </button>
            
            {canAccessTab('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-tab ${activeTab === 'users' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">👥</span>
                إدارة المستخدمين
              </button>
            )}
            
            {canAccessTab('warehouse') && (
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`nav-tab ${activeTab === 'warehouse' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏭</span>
                إدارة المخازن
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('clinic-registration')}
                className={`nav-tab ${activeTab === 'clinic-registration' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏥</span>
                تسجيل عيادة
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('order-creation')}
                className={`nav-tab ${activeTab === 'order-creation' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📦</span>
                عمل طلبية
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('visit')}
                className={`nav-tab ${activeTab === 'visit' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📝</span>
                تسجيل زيارة
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('visits')}
              className={`nav-tab ${activeTab === 'visits' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📋</span>
              سجل الزيارات
            </button>

            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`nav-tab ${activeTab === 'reports' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📈</span>
                التقارير
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && user.role === 'sales_rep' && (
          <SalesRepDashboard />
        )}

        {activeTab === 'dashboard' && user.role !== 'sales_rep' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            {Object.entries(stats).map(([key, value]) => {
              const titles = {
                total_users: 'إجمالي المستخدمين',
                total_clinics: 'إجمالي العيادات',
                total_doctors: 'إجمالي الأطباء',
                total_visits: 'إجمالي الزيارات',
                total_products: 'إجمالي المنتجات',
                total_warehouses: 'إجمالي المخازن',
                low_stock_items: 'منتجات نقص مخزون',
                today_visits: 'زيارات اليوم',
                pending_reviews: 'مراجعات معلقة',
                pending_clinics: 'عيادات في انتظار الموافقة',
                pending_doctors: 'أطباء في انتظار الموافقة',
                team_members: 'أعضاء الفريق',
                today_team_visits: 'زيارات الفريق اليوم',
                my_warehouses: 'مخازني',
                inventory_items: 'عناصر المخزون'
              };
              
              const colors = {
                total_users: 'text-blue-600',
                total_clinics: 'text-green-600',
                total_doctors: 'text-purple-600',
                total_visits: 'text-indigo-600',
                total_products: 'text-yellow-600',
                total_warehouses: 'text-pink-600',
                low_stock_items: 'text-red-600',
                today_visits: 'text-green-600',
                pending_reviews: 'text-orange-600',
                pending_clinics: 'text-orange-600',
                pending_doctors: 'text-orange-600',
                team_members: 'text-blue-600',
                today_team_visits: 'text-green-600',
                my_warehouses: 'text-purple-600',
                inventory_items: 'text-indigo-600'
              };
              
              return (
                <div key={key} className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {titles[key] || key}
                  </h3>
                  <p className={`text-3xl font-bold ${colors[key] || 'text-blue-600'}`}>{value}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'clinic-registration' && user.role === 'sales_rep' && (
          <ClinicRegistration />
        )}

        {activeTab === 'order-creation' && user.role === 'sales_rep' && (
          <OrderCreation />
        )}

        {activeTab === 'users' && canAccessTab('users') && (
          <UserManagement />
        )}

        {activeTab === 'warehouse' && canAccessTab('warehouse') && (
          <WarehouseManagement />
        )}

        {activeTab === 'visit' && user.role === 'sales_rep' && (
          <VisitRegistration />
        )}

        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">سجل الزيارات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطبيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العيادة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(visit.visit_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.clinic_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visit.is_effective === null
                            ? 'bg-yellow-100 text-yellow-800'
                            : visit.is_effective
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visit.is_effective === null
                            ? 'في انتظار المراجعة'
                            : visit.is_effective
                            ? 'مجدية'
                            : 'غير مجدية'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && canAccessTab('reports') && (
          <ReportsSection />
        )}
        </div>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 loading-shimmer rounded-full mx-auto mb-6"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {user ? <Dashboard /> : <LoginPage />}
    </div>
  );
};

export default App;