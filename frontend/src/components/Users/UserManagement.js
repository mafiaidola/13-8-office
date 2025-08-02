// Enhanced User Management Component - إدارة المستخدمين المحسنة
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
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove mock data and use real data
      const realUsers = response.data?.filter(u => !u.isMock) || [];
      setUsers(realUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const viewUserPerformance = async (targetUser) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/users/${targetUser.id}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedUser({
        ...targetUser,
        performanceData: response.data
      });
      setShowUserCard(true);
    } catch (error) {
      console.error('Error loading user performance:', error);
      // Show user without performance data
      setSelectedUser(targetUser);
      setShowUserCard(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (window.confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) {
      try {
        const token = localStorage.getItem('access_token');
        await Promise.all(
          selectedUsers.map(userId =>
            axios.delete(`${API}/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        
        setSelectedUsers([]);
        setShowBulkActions(false);
        await loadUsers();
        alert('تم حذف المستخدمين بنجاح');
      } catch (error) {
        console.error('Error bulk deleting users:', error);
        alert('حدث خطأ أثناء حذف المستخدمين');
      }
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-500',
      'gm': 'bg-purple-500',
      'finance': 'bg-green-500',
      'line_manager': 'bg-blue-500',
      'area_manager': 'bg-indigo-500',
      'district_manager': 'bg-pink-500',
      'key_account': 'bg-yellow-500',
      'medical_rep': 'bg-teal-500',
      'warehouse_manager': 'bg-orange-500',
      'accounting': 'bg-gray-500'
    };
    return colors[role] || 'bg-gray-400';
  };

  const getRoleTextColor = (role) => {
    const textColors = {
      'admin': 'text-red-800',
      'gm': 'text-purple-800',
      'finance': 'text-green-800',
      'line_manager': 'text-blue-800',
      'area_manager': 'text-indigo-800',
      'district_manager': 'text-pink-800',
      'key_account': 'text-yellow-800',
      'medical_rep': 'text-teal-800',
      'warehouse_manager': 'text-orange-800',
      'accounting': 'text-gray-800'
    };
    return textColors[role] || 'text-gray-600';
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'admin': 'مدير النظام',
      'gm': 'مدير عام',
      'finance': 'المالية',
      'line_manager': 'مدير خط',
      'area_manager': 'مدير منطقة',
      'district_manager': 'مدير مقاطعة',
      'key_account': 'حساب رئيسي',
      'medical_rep': 'مندوب طبي',
      'warehouse_manager': 'مدير مخزن',
      'accounting': 'محاسب'
    };
    return roleLabels[role] || role;
  };

  // Create new user function
  const handleCreateUser = async (userData) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔧 Creating user with data:', userData);
      
      const response = await axios.post(`${API}/users`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ User created successfully:', response.data);
      
      // تسجيل النشاط
      await activityLogger.logUserCreation(
        response.data.id,
        userData.full_name || userData.username,
        {
          role: userData.role,
          department: userData.department || '',
          email: userData.email || '',
          phone: userData.phone || '',
          created_by_role: user?.role
        }
      );
      
      await loadUsers(); // Reload users list
      setShowAddModal(false);
      alert('تم إنشاء المستخدم بنجاح');
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء إنشاء المستخدم';
      alert(`خطأ في إنشاء المستخدم: ${errorMessage}`);
    }
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('users', 'title')}</h1>
              <p className="text-lg opacity-75">إدارة شاملة للمستخدمين مع إحصائيات الأداء</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {showBulkActions && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span>🗑️</span>
                حذف المحددين ({selectedUsers.length})
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              {t('users', 'addUser')}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث عن المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-sm opacity-75">إجمالي المستخدمين</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{users.filter(u => u.role === 'medical_rep').length}</div>
          <div className="text-sm opacity-75">مندوبين طبيين</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{users.filter(u => ['admin', 'gm'].includes(u.role)).length}</div>
          <div className="text-sm opacity-75">إداريين</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
          <div className="text-sm opacity-75">مستخدمين نشطين</div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>جاري تحميل المستخدمين...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <UserPerformanceCard
              key={u.id}
              user={u}
              onViewPerformance={() => viewUserPerformance(u)}
              getRoleLabel={getRoleLabel}
              getRoleColor={getRoleColor}
              getRoleTextColor={getRoleTextColor}
              isSelected={selectedUsers.includes(u.id)}
              onToggleSelection={() => toggleUserSelection(u.id)}
            />
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-bold mb-2">لا توجد مستخدمين</h3>
          <p className="text-gray-600">لم يتم العثور على مستخدمين مطابقين للبحث</p>
        </div>
      )}

      {/* User Performance Modal */}
      {showUserCard && selectedUser && (
        <UserDetailedProfile
          user={selectedUser}
          onClose={() => setShowUserCard(false)}
          getRoleLabel={getRoleLabel}
          language={language}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateUser}
          language={language}
          isRTL={isRTL}
        />
      )}
    </div>
  );
};

// User Performance Card Component
const UserPerformanceCard = ({ 
  user, 
  onViewPerformance, 
  getRoleLabel, 
  getRoleColor, 
  getRoleTextColor,
  isSelected,
  onToggleSelection 
}) => {
  const stats = user.stats_last_30_days || {};
  
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="w-4 h-4 text-blue-600 rounded"
          />
          {user.photo ? (
            <img 
              src={user.photo} 
              alt={user.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.full_name?.charAt(0) || '؟'}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg">{user.full_name}</h3>
            <p className="text-sm opacity-75">@{user.username}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)} text-white`}>
          {getRoleLabel(user.role)}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-500/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-300">{stats.visits || 0}</div>
          <div className="text-xs text-blue-200">زيارات (30 يوم)</div>
        </div>
        <div className="bg-green-500/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-300">{stats.orders || 0}</div>
          <div className="text-xs text-green-200">طلبات (30 يوم)</div>
        </div>
        <div className="bg-purple-500/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-300">{stats.order_value?.toFixed(0) || 0}</div>
          <div className="text-xs text-purple-200">قيمة الطلبات</div>
        </div>
        <div className="bg-orange-500/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-orange-300">{stats.new_clinics || 0}</div>
          <div className="text-xs text-orange-200">عيادات جديدة</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewPerformance}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm flex items-center justify-center gap-2"
      >
        <span>📊</span>
        عرض بطاقة الأداء التفصيلية
      </button>
    </div>
  );
};

// User Detailed Profile Modal
const UserDetailedProfile = ({ user, onClose, getRoleLabel, language }) => {
  const performanceData = user.performanceData || {};
  const visitStats = performanceData.visit_stats || {};
  const orderStats = performanceData.order_stats || {};
  const clinicStats = performanceData.clinic_stats || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {user.full_name?.charAt(0) || '؟'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{user.full_name}</h2>
                <p className="text-lg opacity-75">@{user.username}</p>
                <p className="text-sm opacity-60">{getRoleLabel(user.role)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🚶‍♂️</span>
                إحصائيات الزيارات
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>إجمالي الزيارات:</span>
                  <span className="font-bold">{visitStats.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>زيارات هذا الشهر:</span>
                  <span className="font-bold">{visitStats.this_month || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط الزيارات اليومية:</span>
                  <span className="font-bold">{visitStats.daily_average || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🛒</span>
                إحصائيات الطلبات
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>إجمالي الطلبات:</span>
                  <span className="font-bold">{orderStats.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>قيمة الطلبات:</span>
                  <span className="font-bold">{orderStats.total_value?.toFixed(0) || 0} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط قيمة الطلبية:</span>
                  <span className="font-bold">{orderStats.average_value?.toFixed(0) || 0} ج.م</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🏥</span>
                إحصائيات العيادات
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>عيادات مسجلة:</span>
                  <span className="font-bold">{clinicStats.registered || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>عيادات نشطة:</span>
                  <span className="font-bold">{clinicStats.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>معدل النجاح:</span>
                  <span className="font-bold">{clinicStats.success_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">معلومات إضافية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>البريد الإلكتروني:</strong> {user.email || 'غير محدد'}
              </div>
              <div>
                <strong>رقم الهاتف:</strong> {user.phone || 'غير محدد'}
              </div>
              <div>
                <strong>تاريخ الإنشاء:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString('ar') : 'غير محدد'}
              </div>
              <div>
                <strong>آخر تسجيل دخول:</strong> {user.last_login ? new Date(user.last_login).toLocaleDateString('ar') : 'غير محدد'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;