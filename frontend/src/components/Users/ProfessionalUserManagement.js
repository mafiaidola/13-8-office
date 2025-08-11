// Professional User Management - إدارة المستخدمين الاحترافية مع الكروت المفخمة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const ProfessionalUserManagement = ({ language = 'ar', theme = 'dark', user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'medical_rep',
    password: '',
    phone: '',
    area_id: '',
    line_id: '',
    manager_id: '',
    is_active: true
  });

  const { t, tc, tn, tf, tm } = useGlobalTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setShowAddModal(false);
        resetForm();
        
        // تسجيل النشاط
        await comprehensiveActivityService.recordUserCreation(newUser);
      } else {
        console.error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      full_name: '',
      email: '',
      role: 'medical_rep',
      password: '',
      phone: '',
      area_id: '',
      line_id: '',
      manager_id: '',
      is_active: true
    });
  };

  // تصفية المستخدمين
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // الحصول على لون الكارت حسب الدور
  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-red-600',
      gm: 'from-purple-500 to-purple-600',
      line_manager: 'from-blue-500 to-blue-600',
      area_manager: 'from-indigo-500 to-indigo-600',
      medical_rep: 'from-green-500 to-green-600',
      accounting: 'from-yellow-500 to-yellow-600',
      finance: 'from-orange-500 to-orange-600'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  // الحصول على أيقونة الدور
  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      gm: '🎯',
      line_manager: '📊',
      area_manager: '🗺️',
      medical_rep: '🩺',
      accounting: '🧮',
      finance: '💰'
    };
    return icons[role] || '👤';
  };

  // تنسيق اسم الدور
  const formatRoleName = (role) => {
    const roleNames = {
      admin: 'مدير النظام',
      gm: 'المدير العام',
      line_manager: 'مدير خط',
      area_manager: 'مدير منطقة',
      medical_rep: 'مندوب طبي',
      accounting: 'محاسب',
      finance: 'مسؤول مالي'
    };
    return roleNames[role] || role;
  };

  // تنسيق تاريخ آخر نشاط
  const formatLastActivity = (date) => {
    if (!date) return 'لم يسجل دخول بعد';
    const now = new Date();
    const lastActivity = new Date(date);
    const diffHours = Math.floor((now - lastActivity) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'نشط الآن';
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return lastActivity.toLocaleDateString('ar-EG');
  };

  // إحصائيات المستخدمين
  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    reps: users.filter(u => u.role === 'medical_rep').length,
    managers: users.filter(u => u.role.includes('manager')).length
  };

  return (
    <div className="professional-user-management min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <span className="ml-4 text-5xl">👥</span>
                إدارة المستخدمين الاحترافية
              </h1>
              <p className="text-indigo-100 text-lg">
                نظام شامل لإدارة المستخدمين مع معلومات تفصيلية وإحصائيات متقدمة
              </p>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                <span className="ml-3 text-2xl">➕</span>
                إضافة مستخدم جديد
              </button>
              
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? '⏳' : '🔄'} تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">المستخدمون النشطون</p>
                <p className="text-3xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">غير النشطين</p>
                <p className="text-3xl font-bold text-red-600">{userStats.inactive}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">المدراء</p>
                <p className="text-3xl font-bold text-purple-600">{userStats.admins}</p>
              </div>
              <div className="text-4xl">👑</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">المناديب</p>
                <p className="text-3xl font-bold text-orange-600">{userStats.reps}</p>
              </div>
              <div className="text-4xl">🩺</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">مدراء الخطوط</p>
                <p className="text-3xl font-bold text-indigo-600">{userStats.managers}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <input
                type="text"
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
              />
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="gm">المدير العام</option>
                <option value="line_manager">مدير خط</option>
                <option value="area_manager">مدير منطقة</option>
                <option value="medical_rep">مندوب طبي</option>
                <option value="accounting">محاسب</option>
                <option value="finance">مسؤول مالي</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🃏 كروت
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 جدول
              </button>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-xl">جاري تحميل المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد مستخدمين</h3>
            <p className="text-gray-600">لم يتم العثور على مستخدمين مطابقين للبحث</p>
          </div>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Card Header with Role Gradient */}
                    <div className={`bg-gradient-to-r ${getRoleColor(user.role)} p-6 text-white`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">{getRoleIcon(user.role)}</div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {user.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-1">{user.full_name}</h3>
                      <p className="text-sm opacity-90">@{user.username}</p>
                      <p className="text-sm opacity-90 mt-1">{formatRoleName(user.role)}</p>
                    </div>

                    {/* Card Body with Detailed Information */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="ml-2">📧</span>
                            معلومات الاتصال
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">البريد الإلكتروني:</span>
                              <span className="font-medium">{user.email || 'غير محدد'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">الهاتف:</span>
                              <span className="font-medium">{user.phone || 'غير محدد'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Work Information */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="ml-2">💼</span>
                            معلومات العمل
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">الدور:</span>
                              <span className="font-medium">{formatRoleName(user.role)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">المنطقة:</span>
                              <span className="font-medium">{user.area_name || 'غير محدد'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">الخط:</span>
                              <span className="font-medium">{user.line_name || 'غير محدد'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">المدير:</span>
                              <span className="font-medium">{user.manager_name || 'غير محدد'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Activity Information */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="ml-2">📊</span>
                            النشاط والإحصائيات
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">آخر نشاط:</span>
                              <span className="font-medium">{formatLastActivity(user.last_login)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">تاريخ الإنشاء:</span>
                              <span className="font-medium">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">عدد الزيارات:</span>
                              <span className="font-medium">{user.visits_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">المبيعات:</span>
                              <span className="font-medium">{user.sales_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Permissions */}
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="ml-2">🔐</span>
                            الصلاحيات والأذونات
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {user.role === 'admin' && <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">إدارة كاملة</span>}
                            {user.role === 'gm' && <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">إدارة عامة</span>}
                            {user.role.includes('manager') && <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">إدارة فريق</span>}
                            {user.role === 'medical_rep' && <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">زيارات طبية</span>}
                            {user.role === 'accounting' && <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">محاسبة</span>}
                            {user.role === 'finance' && <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">مالية</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex space-x-3 space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                        >
                          📄 عرض التفاصيل
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({ ...user });
                            setShowAddModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                        >
                          ✏️ تعديل
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-right p-4 font-semibold text-gray-700">المستخدم</th>
                        <th className="text-right p-4 font-semibold text-gray-700">الدور</th>
                        <th className="text-right p-4 font-semibold text-gray-700">الاتصال</th>
                        <th className="text-right p-4 font-semibold text-gray-700">الحالة</th>
                        <th className="text-right p-4 font-semibold text-gray-700">آخر نشاط</th>
                        <th className="text-right p-4 font-semibold text-gray-700">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white text-xl mr-4`}>
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{user.full_name}</div>
                                <div className="text-gray-600 text-sm">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                              {formatRoleName(user.role)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div>{user.email}</div>
                              <div className="text-gray-600">{user.phone}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? '✅ نشط' : '❌ غير نشط'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {formatLastActivity(user.last_login)}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all"
                              >
                                تفاصيل
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setFormData({ ...user });
                                  setShowAddModal(true);
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                              >
                                تعديل
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="medical_rep">مندوب طبي</option>
                    <option value="line_manager">مدير خط</option>
                    <option value="area_manager">مدير منطقة</option>
                    <option value="accounting">محاسب</option>
                    <option value="finance">مسؤول مالي</option>
                    <option value="gm">المدير العام</option>
                    <option value="admin">مدير النظام</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">
                    المستخدم نشط
                  </span>
                </label>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {selectedUser ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم الشاملة</h2>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* User Profile Header */}
              <div className={`bg-gradient-to-r ${getRoleColor(selectedUser.role)} rounded-xl p-8 text-white mb-8`}>
                <div className="flex items-center">
                  <div className="text-6xl mr-6">{getRoleIcon(selectedUser.role)}</div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{selectedUser.full_name}</h1>
                    <p className="text-xl opacity-90">@{selectedUser.username}</p>
                    <p className="text-lg opacity-90">{formatRoleName(selectedUser.role)}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">المعلومات الشخصية</h3>
                  <div className="space-y-3">
                    <div><strong>الاسم الكامل:</strong> {selectedUser.full_name}</div>
                    <div><strong>اسم المستخدم:</strong> @{selectedUser.username}</div>
                    <div><strong>البريد الإلكتروني:</strong> {selectedUser.email || 'غير محدد'}</div>
                    <div><strong>رقم الهاتف:</strong> {selectedUser.phone || 'غير محدد'}</div>
                    <div><strong>تاريخ الإنشاء:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">معلومات العمل</h3>
                  <div className="space-y-3">
                    <div><strong>الدور:</strong> {formatRoleName(selectedUser.role)}</div>
                    <div><strong>المنطقة:</strong> {selectedUser.area_name || 'غير محدد'}</div>
                    <div><strong>الخط:</strong> {selectedUser.line_name || 'غير محدد'}</div>
                    <div><strong>المدير المباشر:</strong> {selectedUser.manager_name || 'غير محدد'}</div>
                    <div><strong>الحالة:</strong> 
                      <span className={`mr-2 px-2 py-1 rounded text-sm ${selectedUser.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {selectedUser.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity Statistics */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">إحصائيات النشاط</h3>
                  <div className="space-y-3">
                    <div><strong>آخر تسجيل دخول:</strong> {formatLastActivity(selectedUser.last_login)}</div>
                    <div><strong>عدد الزيارات:</strong> {selectedUser.visits_count || 0}</div>
                    <div><strong>عدد المبيعات:</strong> {selectedUser.sales_count || 0}</div>
                    <div><strong>المعدل الشهري:</strong> {selectedUser.monthly_average || 0}</div>
                    <div><strong>التقييم:</strong> ⭐⭐⭐⭐⭐</div>
                  </div>
                </div>

                {/* Permissions and Access */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">الصلاحيات والوصول</h3>
                  <div className="space-y-3">
                    <div><strong>مستوى الوصول:</strong> {selectedUser.role === 'admin' ? 'كامل' : 'محدود'}</div>
                    <div><strong>الوحدات المتاحة:</strong> 
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['لوحة التحكم', 'إدارة العيادات', 'الزيارات', 'التقارير'].map(module => (
                          <span key={module} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">{module}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalUserManagement;