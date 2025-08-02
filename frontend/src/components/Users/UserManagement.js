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

  const handleEditUser = (userId) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      setShowAddModal(true); // Reuse the modal for editing
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete.full_name}"؟`)) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`${API}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Log the delete activity
        await activityLogger.logUserAction('حذف مستخدم', {
          target_user_id: userId,
          target_user_name: userToDelete.full_name,
          target_user_role: userToDelete.role,
          deleted_by: user.full_name,
          deleted_by_role: user.role
        });
        
        await loadUsers();
        alert('تم حذف المستخدم بنجاح');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('حدث خطأ أثناء حذف المستخدم');
      }
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
      
      const newUser = {
        username: userData.username,
        email: userData.email,
        full_name: userData.fullName,
        password: userData.password || 'temp123',
        role: userData.role,
        phone: userData.phone,
        department: userData.department,
        area: userData.area,
        permissions: userData.permissions || [],
        status: 'active',
        created_by: user.id,
        created_by_name: user.full_name
      };
      
      await axios.post(`${API}/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Log user creation
      await activityLogger.logUserAction('إنشاء مستخدم', {
        target_user_name: userData.fullName,
        target_user_role: userData.role,
        created_by: user.full_name,
        created_by_role: user.role
      });
      
      await loadUsers();
      alert('تم إنشاء المستخدم بنجاح');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('حدث خطأ أثناء إنشاء المستخدم');
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
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
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

// Enhanced User Performance Card Component
const UserPerformanceCard = ({ 
  user, 
  onViewPerformance, 
  getRoleLabel, 
  getRoleColor, 
  getRoleTextColor,
  isSelected,
  onToggleSelection,
  onEditUser,
  onDeleteUser
}) => {
  const stats = user.stats_last_30_days || {};
  
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-400/50' : ''
    }`}>
      
      {/* Header with User Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="w-5 h-5 text-blue-600 rounded border-2 border-white/30"
          />
          
          {/* Enhanced Avatar */}
          <div className="relative">
            {user.photo ? (
              <img 
                src={user.photo} 
                alt={user.full_name}
                className="w-16 h-16 rounded-full object-cover border-3 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white/30">
                {user.full_name?.charAt(0) || user.username?.charAt(0) || '؟'}
              </div>
            )}
            
            {/* Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              user.status === 'active' ? 'bg-green-500' : 
              user.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
            }`}></div>
          </div>
          
          <div>
            <h3 className="font-bold text-xl text-white">{user.full_name}</h3>
            <p className="text-sm text-white/70 mb-1">@{user.username}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">📧</span>
              <span className="text-xs text-white/60">{user.email || 'غير محدد'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`px-3 py-2 rounded-full text-xs font-bold ${getRoleColor(user.role)} text-white shadow-lg border border-white/30`}>
            {getRoleLabel(user.role)}
          </span>
          <div className="text-xs text-white/60 mt-2">
            {user.department || 'لا يوجد قسم'}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📱</span>
          معلومات الاتصال
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/60">📞</span>
            <span className="text-white/80">{user.phone || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">🏢</span>
            <span className="text-white/80">{user.department || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">📍</span>
            <span className="text-white/80">{user.area || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">📅</span>
            <span className="text-white/80">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Performance Metrics with More Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Orders Approved */}
        <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-lg font-bold text-green-300">{stats.approved_orders || 0}</div>
          <div className="text-xs text-green-200">طلبات معتمدة</div>
        </div>
        {/* Total Debts */}
        <div className="text-center bg-red-500/10 rounded-lg p-3 border border-red-500/20">
          <div className="text-lg font-bold text-red-300">{stats.total_debts ? `${stats.total_debts}ج.م` : '0ج.م'}</div>
          <div className="text-xs text-red-200">إجمالي الديون</div>
        </div>
        {/* Remaining Debts */}
        <div className="text-center bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="text-lg font-bold text-orange-300">{stats.remaining_debts ? `${stats.remaining_debts}ج.م` : '0ج.م'}</div>
          <div className="text-xs text-orange-200">ديون متبقية</div>
        </div>
        {/* Approved Clinics */}
        <div className="text-center bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="text-lg font-bold text-blue-300">{stats.approved_clinics || 0}</div>
          <div className="text-xs text-blue-200">عيادات معتمدة</div>
        </div>
      </div>

      {/* Visit Statistics (Weekly/Monthly/Yearly) */}
      <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📊</span>
          إحصائيات الزيارات
        </h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-300">{stats.visits_weekly || 0}</div>
            <div className="text-purple-200">أسبوعياً</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-300">{stats.visits_monthly || 0}</div>
            <div className="text-indigo-200">شهرياً</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-300">{stats.visits_yearly || 0}</div>
            <div className="text-cyan-200">سنوياً</div>
          </div>
        </div>
      </div>

      {/* Manager and Location Info */}
      <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>🏢</span>
          معلومات إدارية
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white/60">المدير المباشر:</span>
            <span className="text-white/80">{user.direct_manager || 'غير محدد'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">الخط:</span>
            <span className="text-white/80">{user.line_name || user.line || 'غير محدد'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">المنطقة:</span>
            <span className="text-white/80">{user.region || user.area || 'غير محدد'}</span>
          </div>
        </div>
      </div>

      {/* Status & Activity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            user.status === 'active' ? 'bg-green-400' : 
            user.status === 'inactive' ? 'bg-gray-400' : 'bg-red-400'
          }`}></span>
          <span className="text-sm text-white/70">
            {user.status === 'active' ? 'نشط' : 
             user.status === 'inactive' ? 'غير نشط' : 'معلق'}
          </span>
        </div>
        
        <div className="text-xs text-white/60">
          آخر نشاط: {user.last_activity ? 
            new Date(user.last_activity).toLocaleDateString('ar-EG') : 
            'لا يوجد'
          }
        </div>
      </div>

      {/* Permissions & Access */}
      <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
        <h5 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
          <span>🔐</span>
          الصلاحيات
        </h5>
        <div className="flex flex-wrap gap-1">
          {user.permissions?.slice(0, 3).map((permission, index) => (
            <span key={index} className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
              {permission}
            </span>
          )) || (
            <span className="text-xs text-white/50">لا توجد صلاحيات محددة</span>
          )}
          {user.permissions?.length > 3 && (
            <span className="text-xs text-white/60">+{user.permissions.length - 3} أخرى</span>
          )}
        </div>
      </div>

      {/* Enhanced Action Buttons with Edit/Delete */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewPerformance()}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2"
        >
          <span>👁️</span>
          التفاصيل
        </button>
        
        <button
          onClick={() => onEditUser(user.id)}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
          title="تعديل المستخدم"
        >
          <span>✏️</span>
          تعديل
        </button>
        
        <button
          onClick={() => onDeleteUser(user.id)}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
          title="حذف المستخدم"
        >
          <span>🗑️</span>
          حذف
        </button>
      </div>
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

// Add User Modal Component
const AddUserModal = ({ onClose, onSave, language, isRTL }) => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'medical_rep',
    department: '',
    line_id: '',
    area_id: '',
    status: 'active'
  });

  const roles = [
    { value: 'admin', label: 'مدير النظام' },
    { value: 'gm', label: 'مدير عام' },
    { value: 'finance', label: 'المالية' },
    { value: 'line_manager', label: 'مدير خط' },
    { value: 'area_manager', label: 'مدير منطقة' },
    { value: 'district_manager', label: 'مدير مقاطعة' },
    { value: 'key_account', label: 'عملاء مميزين' },
    { value: 'medical_rep', label: 'مندوب طبي' },
    { value: 'warehouse_manager', label: 'مدير مخزن' },
    { value: 'accounting', label: 'محاسبة' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.full_name || !formData.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>👤</span>
              إضافة مستخدم جديد
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="اسم المستخدم"
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="البريد الإلكتروني"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="رقم الهاتف"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="كلمة المرور"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  الدور *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value} className="bg-gray-800">
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  القسم
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="القسم"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  الحالة
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="active" className="bg-gray-800">نشط</option>
                  <option value="inactive" className="bg-gray-800">غير نشط</option>
                  <option value="suspended" className="bg-gray-800">معلق</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-white/20">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
              >
                <span>✅</span>
                إنشاء المستخدم
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600/50 text-white px-6 py-3 rounded-lg hover:bg-gray-600/70 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <span>❌</span>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;