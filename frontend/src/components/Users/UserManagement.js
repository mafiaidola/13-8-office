// Enhanced User Management Component - إدارة المستخدمين المحسنة - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import axios from 'axios';
import ComprehensiveUserModal from './ComprehensiveUserModal';
import AddUserModal from './AddUserModal';
import ExcelManager from '../Excel/ExcelManager.js';

const UserManagement = ({ user, language = 'en', isRTL }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserCard, setShowUserCard] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showComprehensiveModal, setShowComprehensiveModal] = useState(false);
  const [comprehensiveModalMode, setComprehensiveModalMode] = useState('view'); // 'view' or 'edit'
  
  const { t, tc, tn, tf, tm } = useGlobalTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    loadUsers();
    
    // Store previous section for navigation
    sessionStorage.setItem('previousSection', t('users', 'title'));
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('✅ Loaded users from API:', response.data.length);
        // Filter out test users if they exist
        const filteredUsers = response.data.filter(user => 
          !user.username?.includes('test') && 
          !user.username?.includes('demo') &&
          !user.full_name?.includes('تجربة') &&
          !user.full_name?.includes('Test')
        );
        setUsers(filteredUsers);
      } else {
        console.log('⚠️ API returned invalid data format');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: language === 'ar' ? 'مدير النظام' : 'System Admin',
      manager: language === 'ar' ? 'مدير' : 'Manager',
      medical_rep: language === 'ar' ? 'مندوب طبي' : 'Medical Rep',
      accountant: language === 'ar' ? 'محاسب' : 'Accountant',
      accounting: language === 'ar' ? 'محاسب' : 'Accountant',
      warehouse_keeper: language === 'ar' ? 'أمين مخزن' : 'Warehouse Keeper',
      warehouse_manager: language === 'ar' ? 'مدير مخزن' : 'Warehouse Manager',
      gm: language === 'ar' ? 'مدير عام' : 'General Manager',
      sales_rep: language === 'ar' ? 'مندوب مبيعات' : 'Sales Representative',
      line_manager: language === 'ar' ? 'مدير خط' : 'Line Manager',
      area_manager: language === 'ar' ? 'مدير منطقة' : 'Area Manager',
      district_manager: language === 'ar' ? 'مدير منطقة' : 'District Manager',
      key_account: language === 'ar' ? 'حساب رئيسي' : 'Key Account'
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
    setComprehensiveModalMode('view');
    setShowComprehensiveModal(true);
    console.log('🔍 Opening comprehensive user details for:', userData.full_name);
  };

  const handleEditUser = (userId) => {
    const userData = users.find(u => u.id === userId);
    if (userData) {
      setSelectedUser(userData);
      setComprehensiveModalMode('edit');
      setShowComprehensiveModal(true);
      console.log('✏️ Opening comprehensive user edit for:', userData.full_name);
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    const confirmMessage = language === 'ar' 
      ? `هل أنت متأكد من حذف المستخدم: ${userToDelete?.full_name}؟`
      : `Are you sure you want to delete user: ${userToDelete?.full_name}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.delete(`${API}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const successMessage = language === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully';
          alert(successMessage);
          loadUsers(); // Reload users list
        } else {
          throw new Error(response.data.message || (language === 'ar' ? 'فشل في حذف المستخدم' : 'Failed to delete user'));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.detail || error.message || 
          (language === 'ar' ? 'حدث خطأ أثناء حذف المستخدم' : 'An error occurred while deleting the user');
        const errorPrefix = language === 'ar' ? 'خطأ في حذف المستخدم: ' : 'Error deleting user: ';
        alert(`${errorPrefix}${errorMessage}`);
      }
    }
  };

  // Function to delete test/demo users
  const handleDeleteTestUsers = async () => {
    const testUsers = users.filter(user => 
      user.username?.toLowerCase().includes('test') || 
      user.username?.toLowerCase().includes('demo') ||
      user.full_name?.includes('تجربة') ||
      user.full_name?.toLowerCase().includes('test') ||
      user.email?.toLowerCase().includes('test')
    );

    if (testUsers.length === 0) {
      const noTestUsersMessage = language === 'ar' ? 'لا توجد مستخدمين تجريبيين للحذف' : 'No test users found to delete';
      alert(noTestUsersMessage);
      return;
    }

    const confirmMessage = language === 'ar' 
      ? `⚠️ سيتم حذف ${testUsers.length} مستخدم تجريبي نهائياً من النظام!\n\nهل أنت متأكد من المتابعة؟`
      : `⚠️ This will permanently delete ${testUsers.length} test users from the system!\n\nAre you sure you want to continue?`;

    if (window.confirm(confirmMessage)) {
      let successCount = 0;
      let errorCount = 0;

      for (const user of testUsers) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.delete(`${API}/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          console.error(`Error deleting test user ${user.id}:`, error);
          errorCount++;
        }
      }

      loadUsers(); // Refresh the users list
      const resultMessage = language === 'ar' 
        ? `✅ تم حذف ${successCount} مستخدم تجريبي بنجاح${errorCount > 0 ? `\n❌ فشل حذف ${errorCount} مستخدم` : ''}`
        : `✅ Successfully deleted ${successCount} test users${errorCount > 0 ? `\n❌ Failed to delete ${errorCount} users` : ''}`;
      alert(resultMessage);
    }
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
            {t('users', 'title')}
          </h1>
          <p className="text-lg opacity-75">
            {language === 'ar' ? 'إدارة شاملة لجميع المستخدمين في النظام' : 'Comprehensive management of all system users'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
          >
            <span>➕</span>
            {t('users', 'addUser')}
          </button>
          
          <button
            onClick={handleDeleteTestUsers}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
            title={language === 'ar' ? 'حذف جميع المستخدمين التجريبيين' : 'Delete all test users'}
          >
            <span>🗑️</span>
            {language === 'ar' ? 'حذف التجريبيين' : 'Delete Test Users'}
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

      {/* Excel Management Section */}
      <ExcelManager
        dataType="users"
        title={language === 'ar' ? "المستخدمين" : "Users"}
        icon="👥"
        onImportComplete={() => {
          loadUsers(); // Reload data after import
        }}
        className="mb-6"
      />

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
              className="user-card-original bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ minHeight: '500px' }}
            >
              {/* Header with checkbox and profile */}
              <div className="flex items-start justify-between mb-6">
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
                      className="w-20 h-20 rounded-full object-cover border-3 border-white/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-3 border-white/30">
                      {userData.full_name?.charAt(0) || userData.username?.charAt(0) || '؟'}
                    </div>
                  )}
                  
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white ${
                    userData.status === 'active' ? 'bg-green-500' : 
                    userData.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                  } shadow-lg`}></div>
                </div>
              </div>

              {/* User Details */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{userData.full_name || (language === 'ar' ? 'غير محدد' : 'Not Specified')}</h3>
                <p className="text-sm text-white/70 mb-3">@{userData.username}</p>
                
                <div className="flex justify-center mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRoleColor(userData.role)} ${getRoleTextColor(userData.role)}`}>
                    {getRoleLabel(userData.role)}
                  </span>
                </div>
              </div>

              {/* Contact Information - RESTORED AS ORIGINAL */}
              <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-lg">📧</span>
                    <span className="text-white/80 flex-1">{userData.email || (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-lg">📱</span>
                    <span className="text-white/80 flex-1">{userData.phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-lg">📍</span>
                    <span className="text-white/80 flex-1">{userData.area || (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 text-lg">🏢</span>
                    <span className="text-white/80 flex-1">{userData.department || (language === 'ar' ? 'عام' : 'General')}</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats Grid - Enhanced with new metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Original stats */}
                <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 text-center">
                  <div className="text-xl font-bold text-green-400">{userData.stats_last_30_days?.visits || 0}</div>
                  <div className="text-xs text-green-200/80">الزيارات</div>
                </div>
                
                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 text-center">
                  <div className="text-xl font-bold text-blue-400">{userData.stats_last_30_days?.orders || 0}</div>
                  <div className="text-xs text-blue-200/80">الطلبات</div>
                </div>

                {/* NEW METRICS REQUESTED */}
                <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
                  <div className="text-xl font-bold text-red-400">{userData.stats_last_30_days?.total_debts || 0}</div>
                  <div className="text-xs text-red-200/80">المديونيات</div>
                </div>

                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                  <div className="text-xl font-bold text-emerald-400">{userData.stats_last_30_days?.total_collections || 0}</div>
                  <div className="text-xs text-emerald-200/80">التحصيلات</div>
                </div>

                <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20 text-center">
                  <div className="text-xl font-bold text-orange-400">{userData.stats_last_30_days?.total_visits || userData.stats_last_30_days?.visits || 0}</div>
                  <div className="text-xs text-orange-200/80">إجمالي الزيارات</div>
                </div>

                <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
                  <div className="text-xl font-bold text-cyan-400">{userData.stats_last_30_days?.added_clinics || 0}</div>
                  <div className="text-xs text-cyan-200/80">العيادات المضافة</div>
                </div>
              </div>

              {/* Performance Bar - RESTORED */}
              <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">الأداء العام</span>
                  <span className="text-sm font-bold text-white">{userData.stats_last_30_days?.performance_percentage || 0}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${userData.stats_last_30_days?.performance_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Revenue Display - RESTORED */}
              {userData.role === 'medical_rep' && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-3 mb-4 border border-yellow-500/20">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {userData.stats_last_30_days?.revenue?.toLocaleString('ar-EG') || '0'} ج.م
                    </div>
                    <div className="text-xs text-yellow-200/80">إجمالي المبيعات الشهرية</div>
                  </div>
                </div>
              )}

              {/* Rating Display - RESTORED */}
              <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">التقييم</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star}
                        className={`text-lg ${
                          star <= (userData.stats_last_30_days?.rating || 0) 
                            ? 'text-yellow-400' 
                            : 'text-white/20'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                    <span className="text-sm text-white ml-2">
                      {userData.stats_last_30_days?.rating || 0}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - RESTORED */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewPerformance(userData)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
                >
                  <span>📊</span>
                  التفاصيل
                </button>
                
                <button
                  onClick={() => handleEditUser(userData.id)}
                  className="bg-green-600 hover:bg-green-700 text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
                >
                  <span>✏️</span>
                  تعديل
                </button>
                
                <button
                  onClick={() => handleDeleteUser(userData.id)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
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

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onUserAdded={(newUser) => {
            console.log('✅ New user added:', newUser);
            loadUsers();
            setShowAddModal(false);
          }}
          language={language}
        />
      )}

      {/* Comprehensive User Modal - مودال شامل لتفاصيل وتعديل المستخدم */}
      {showComprehensiveModal && selectedUser && (
        <ComprehensiveUserModal
          user={selectedUser}
          mode={comprehensiveModalMode}
          onClose={() => {
            setShowComprehensiveModal(false);
            setSelectedUser(null);
            setComprehensiveModalMode('view');
          }}
          onUserUpdated={() => {
            loadUsers();
            console.log('✅ User updated successfully, reloading users list');
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default UserManagement;