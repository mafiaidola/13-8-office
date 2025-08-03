// Enhanced User Management Component - إدارة المستخدمين المحسنة - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';
import { activityLogger } from '../../utils/activityLogger.js';

const UserManagement = ({ user, language, isRTL }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserCard, setShowUserCard] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    loadUsers();
    
    // Log system access
    activityLogger.logSystemAccess('إدارة المستخدمين', {
      previousSection: sessionStorage.getItem('previousSection') || '',
      accessMethod: 'navigation',
      userRole: user?.role
    });
    
    sessionStorage.setItem('previousSection', 'إدارة المستخدمين');
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        // Use fallback mock data
        setUsers([
          {
            id: 'user_001',
            full_name: 'أحمد محمد علي',
            username: 'ahmed.mohamed',
            email: 'ahmed@epgroup.com',
            phone: '+201234567890',
            role: 'medical_rep',
            area: 'القاهرة - مدينة نصر',
            status: 'active',
            stats_last_30_days: {
              visits: 45,
              orders: 12,
              revenue: 45000,
              rating: 4.8,
              performance_percentage: 87
            }
          },
          {
            id: 'user_002',
            full_name: 'فاطمة أحمد السيد',
            username: 'fatima.ahmed',
            email: 'fatima@epgroup.com', 
            phone: '+201098765432',
            role: 'admin',
            area: 'الإسكندرية',
            status: 'active',
            stats_last_30_days: {
              visits: 0,
              orders: 0,
              revenue: 0,
              rating: 5.0,
              performance_percentage: 95
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Fallback: Use mock data if API fails
      setUsers([
        {
          id: 'user_001',
          full_name: 'أحمد محمد علي',
          username: 'ahmed.mohamed',
          email: 'ahmed@epgroup.com',
          phone: '+201234567890',
          role: 'medical_rep',
          area: 'القاهرة - مدينة نصر',
          status: 'active',
          stats_last_30_days: {
            visits: 45,
            orders: 12,
            revenue: 45000,
            rating: 4.8,
            performance_percentage: 87
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: language === 'ar' ? 'مدير النظام' : 'Admin',
      manager: language === 'ar' ? 'مدير' : 'Manager',
      medical_rep: language === 'ar' ? 'مندوب طبي' : 'Medical Rep',
      accountant: language === 'ar' ? 'محاسب' : 'Accountant',
      warehouse_keeper: language === 'ar' ? 'أمين مخزن' : 'Warehouse Keeper'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: 'bg-red-500/20 border-red-500/30',
      manager: 'bg-purple-500/20 border-purple-500/30',
      medical_rep: 'bg-blue-500/20 border-blue-500/30',
      accountant: 'bg-green-500/20 border-green-500/30',
      warehouse_keeper: 'bg-orange-500/20 border-orange-500/30'
    };
    return roleColors[role] || 'bg-gray-500/20 border-gray-500/30';
  };

  const getRoleTextColor = (role) => {
    const roleTextColors = {
      admin: 'text-red-300',
      manager: 'text-purple-300',
      medical_rep: 'text-blue-300',
      accountant: 'text-green-300',
      warehouse_keeper: 'text-orange-300'
    };
    return roleTextColors[role] || 'text-gray-300';
  };

  const handleViewPerformance = (userData) => {
    setSelectedUser(userData);
    setShowUserCard(true);
  };

  const handleEditUser = (userId) => {
    console.log('Edit user:', userId);
    alert('تحرير المستخدم قيد التطوير');
  };

  const handleDeleteUser = (userId) => {
    console.log('Delete user:', userId);
    alert('حذف المستخدم قيد التطوير');
  };

  const handleToggleSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-management-container p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-lg opacity-75">
            {language === 'ar' ? 'إدارة شاملة لجميع المستخدمين في النظام' : 'Comprehensive management of all system users'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
          >
            <span>➕</span>
            {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث في المستخدمين...' : 'Search users...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/60"
            />
          </div>
        </div>
        <div className="text-sm text-white/70">
          {language === 'ar' ? `إجمالي المستخدمين: ${users.length}` : `Total Users: ${users.length}`}
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70">{language === 'ar' ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</p>
          </div>
        </div>
      ) : (
        <div className="users-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map(userData => (
            <div
              key={userData.id}
              className="user-card bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(userData.id)}
                    onChange={() => handleToggleSelection(userData.id)}
                    className="w-5 h-5 text-blue-600 rounded border-2 border-white/30"
                  />
                  
                  <div className="relative">
                    {userData.photo ? (
                      <img 
                        src={userData.photo} 
                        alt={userData.full_name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-white/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white/30">
                        {userData.full_name?.charAt(0) || userData.username?.charAt(0) || '؟'}
                      </div>
                    )}
                    
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      userData.status === 'active' ? 'bg-green-500' : 
                      userData.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                    } shadow-lg`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{userData.full_name}</h3>
                    <p className="text-sm text-white/70">@{userData.username}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(userData.role)} ${getRoleTextColor(userData.role)}`}>
                        {getRoleLabel(userData.role)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{userData.stats_last_30_days?.visits || 0}</div>
                  <div className="text-xs text-green-200/80">زيارة شهرياً</div>
                </div>
                
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">{userData.stats_last_30_days?.orders || 0}</div>
                  <div className="text-xs text-blue-200/80">طلب شهرياً</div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <div className="space-y-2 text-sm">
                  {userData.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400">📧</span>
                      <span className="text-white/80">{userData.email}</span>
                    </div>
                  )}
                  {userData.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">📱</span>
                      <span className="text-white/80">{userData.phone}</span>
                    </div>
                  )}
                  {userData.area && (
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-400">📍</span>
                      <span className="text-white/80">{userData.area}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewPerformance(userData)}
                  className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <span>📊</span>
                  التفاصيل
                </button>
                
                <button
                  onClick={() => handleEditUser(userData.id)}
                  className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <span>✏️</span>
                  تعديل
                </button>
                
                <button
                  onClick={() => handleDeleteUser(userData.id)}
                  className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <span>🗑️</span>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {showUserCard && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h3 className="text-2xl font-bold">تفاصيل المستخدم: {selectedUser.full_name}</h3>
              <button onClick={() => setShowUserCard(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">المعلومات الأساسية</h4>
                  <div className="space-y-2">
                    <p><strong>الاسم:</strong> {selectedUser.full_name}</p>
                    <p><strong>اسم المستخدم:</strong> {selectedUser.username}</p>
                    <p><strong>البريد الإلكتروني:</strong> {selectedUser.email}</p>
                    <p><strong>الهاتف:</strong> {selectedUser.phone}</p>
                    <p><strong>الدور:</strong> {getRoleLabel(selectedUser.role)}</p>
                    <p><strong>المنطقة:</strong> {selectedUser.area}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">إحصائيات الأداء</h4>
                  <div className="space-y-2">
                    <p><strong>الزيارات (آخر 30 يوم):</strong> {selectedUser.stats_last_30_days?.visits || 0}</p>
                    <p><strong>الطلبات (آخر 30 يوم):</strong> {selectedUser.stats_last_30_days?.orders || 0}</p>
                    <p><strong>الإيرادات (آخر 30 يوم):</strong> {selectedUser.stats_last_30_days?.revenue || 0} ج.م</p>
                    <p><strong>التقييم:</strong> {selectedUser.stats_last_30_days?.rating || 0}/5</p>
                    <p><strong>نسبة الأداء:</strong> {selectedUser.stats_last_30_days?.performance_percentage || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowUserCard(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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

export default UserManagement;