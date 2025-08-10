import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ModernProfessionalHeader = ({ 
  user, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  isRTL, 
  setIsRTL, 
  onSearch,
  systemSettings,
  onToggleSidebar,
  availableThemes = {} // Add available themes prop
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  // Enhanced notification system
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'info', 
      title: language === 'ar' ? 'تحديث النظام' : 'System Update', 
      message: language === 'ar' ? 'ميزات جديدة متاحة' : 'New features available', 
      time: '5m ago', 
      read: false,
      action: () => console.log('Navigate to system updates')
    },
    { 
      id: 2, 
      type: 'success', 
      title: language === 'ar' ? 'اكتمال النسخ الاحتياطي' : 'Backup Complete', 
      message: language === 'ar' ? 'تم إنجاز النسخ الاحتياطي اليومي بنجاح' : 'Daily backup completed successfully', 
      time: '1h ago', 
      read: false,
      action: () => console.log('View backup details')
    },
    { 
      id: 3, 
      type: 'warning', 
      title: language === 'ar' ? 'تنبيه انخفاض المخزون' : 'Low Stock Alert', 
      message: language === 'ar' ? 'بعض المنتجات على وشك النفاد' : 'Some products are running low', 
      time: '2h ago', 
      read: true,
      action: () => console.log('Navigate to inventory')
    },
    { 
      id: 4, 
      type: 'info', 
      title: language === 'ar' ? 'زيارة جديدة مجدولة' : 'New Visit Scheduled', 
      message: language === 'ar' ? 'تم جدولة زيارة للدكتور أحمد غداً' : 'Visit scheduled with Dr. Ahmed tomorrow', 
      time: '3h ago', 
      read: true,
      action: () => console.log('View visit details')
    }
  ]);
  
  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const languageMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // Enhanced theme definitions - Now using the themes from props
  const themeOptions = availableThemes && Object.keys(availableThemes).length > 0 ? availableThemes : {
    dark: { name: { ar: 'داكن كلاسيكي', en: 'Classic Dark' }, icon: '🌙' },
    professional: { name: { ar: 'أزرق احترافي', en: 'Professional Blue' }, icon: '💼' },
    royal: { name: { ar: 'بنفسجي ملكي', en: 'Royal Purple' }, icon: '👑' },
    medical: { name: { ar: 'أخضر طبي', en: 'Medical Green' }, icon: '🏥' },
    luxury: { name: { ar: 'ذهبي فاخر', en: 'Luxury Gold' }, icon: '✨' },
    power: { name: { ar: 'أحمر قوي', en: 'Power Red' }, icon: '🔥' },
    slate: { name: { ar: 'رمادي متطور', en: 'Advanced Slate' }, icon: '⚡' },
    midnight: { name: { ar: 'ليل عميق', en: 'Deep Night' }, icon: '🌌' }
  };

  // Enhanced language options
  const availableLanguages = {
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
    ar: { name: 'العربية', nativeName: 'Arabic', flag: '🇪🇬', dir: 'rtl' }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user profile
  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/users/${user.id}/comprehensive-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUserProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query, 'global');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (user?.avatar) return user.avatar;
    const initials = user?.full_name ? 
      user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
      user?.username?.charAt(0).toUpperCase() || 'U';
    return initials;
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    if (notification.action) {
      notification.action();
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      'info': '📄',
      'success': '✅', 
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || '📄';
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    const colors = {
      'info': 'border-blue-200 bg-blue-50',
      'success': 'border-green-200 bg-green-50',
      'warning': 'border-yellow-200 bg-yellow-50',
      'error': 'border-red-200 bg-red-50'
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };
  const getRoleInfo = (role) => {
    const roleMap = {
      'admin': { color: 'bg-gradient-to-r from-red-500 to-red-600', icon: '👑', label: language === 'ar' ? 'مدير' : 'Admin' },
      'gm': { color: 'bg-gradient-to-r from-purple-500 to-purple-600', icon: '🎯', label: language === 'ar' ? 'مدير عام' : 'GM' },
      'medical_rep': { color: 'bg-gradient-to-r from-green-500 to-green-600', icon: '🏥', label: language === 'ar' ? 'مندوب طبي' : 'Medical Rep' },
      'sales_rep': { color: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '💼', label: language === 'ar' ? 'مندوب مبيعات' : 'Sales Rep' },
      'accounting': { color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', icon: '📊', label: language === 'ar' ? 'محاسب' : 'Accountant' },
      'line_manager': { color: 'bg-gradient-to-r from-orange-500 to-orange-600', icon: '📋', label: language === 'ar' ? 'مدير خط' : 'Line Manager' }
    };
    return roleMap[role] || { color: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: '👤', label: role };
  };

  const roleInfo = getRoleInfo(user?.role);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Enhanced Professional Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center justify-between h-20 px-6">
          
          {/* Left Section - Enhanced Logo and Controls */}
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            {/* Modern Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="group p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              title={language === 'ar' ? 'تبديل القائمة' : 'Toggle Menu'}
            >
              <svg className="w-5 h-5 text-white transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Enhanced Logo Section */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-3 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {language === 'ar' ? 'نظام الإدارة الطبية' : 'Medical Management System'}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {language === 'ar' ? 'حل شامل للرعاية الصحية' : 'Comprehensive Healthcare Solution'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Enhanced Global Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:inset-y-0 rtl:right-0 rtl:left-auto pl-4 rtl:pr-4 flex items-center">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-12 rtl:pr-12 rtl:pl-6 pr-6 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/80 focus:bg-white placeholder-gray-500 text-gray-800 font-medium shadow-inner"
                placeholder={language === 'ar' ? 'البحث الشامل في النظام...' : 'Search patients, clinics, orders, reports...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute inset-y-0 right-0 rtl:inset-y-0 rtl:left-0 rtl:right-auto pr-2 rtl:pl-2 flex items-center"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium">
                    {language === 'ar' ? 'بحث' : 'Search'}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Enhanced Control Panel */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            
            {/* Theme Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                  setShowLanguageMenu(false);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg group"
                title={language === 'ar' ? 'اختيار الثيم' : 'Theme Selector'}
              >
                <span className="text-lg group-hover:animate-pulse">🎨</span>
              </button>
              
              {showThemeMenu && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-72 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 py-3 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">{language === 'ar' ? 'اختيار الثيم' : 'Theme Selection'}</h3>
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'اختر المظهر المناسب' : 'Choose your preferred appearance'}</p>
                  </div>
                  
                  <div className="px-2 py-2 max-h-80 overflow-y-auto">
                    {Object.entries(themeOptions).map(([key, themeOption]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setTheme(key);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center px-3 py-3 text-sm rounded-xl transition-all duration-200 mb-1 ${
                          theme === key 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-2 border-blue-200' 
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <span className="text-2xl mr-3 rtl:ml-3 rtl:mr-0">{themeOption.icon}</span>
                        <div className="flex-1 text-left rtl:text-right">
                          <div className="font-semibold">{themeOption.name[language] || themeOption.name.en}</div>
                        </div>
                        {theme === key && (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu);
                  setShowThemeMenu(false);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg group"
                title={language === 'ar' ? 'اختيار اللغة' : 'Language Selector'}
              >
                <span className="text-lg group-hover:animate-bounce">{availableLanguages[language]?.flag}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 py-3 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">{language === 'ar' ? 'اختيار اللغة' : 'Language'}</h3>
                  </div>
                  
                  {Object.entries(availableLanguages).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setIsRTL(lang.dir === 'rtl');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 mx-2 mb-1 ${
                        language === code 
                          ? 'bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 border-2 border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <span className="text-2xl mr-3 rtl:ml-3 rtl:mr-0">{lang.flag}</span>
                      <div className="flex-1 text-left rtl:text-right">
                        <div className="font-semibold">{lang.nativeName}</div>
                        <div className="text-xs text-gray-500">{lang.name}</div>
                      </div>
                      {language === code && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowThemeMenu(false);
                  setShowLanguageMenu(false);
                  setShowUserMenu(false);
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg relative group"
              >
                <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                </svg>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                    {unreadCount}
                  </div>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {language === 'ar' ? 'تمييز الكل كمقروء' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500">
                        {unreadCount} {language === 'ar' ? 'غير مقروءة' : 'unread'}
                      </p>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50 hover:bg-blue-100/50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3 rtl:space-x-reverse">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getNotificationColor(notification.type)}`}>
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-800">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 leading-relaxed">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-400">{notification.time}</p>
                              <button 
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {notifications.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-3xl block mb-2">📫</span>
                        <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <button 
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                      onClick={() => {
                        setShowNotifications(false);
                        console.log('Navigate to all notifications');
                      }}
                    >
                      {language === 'ar' ? 'عرض جميع الإشعارات' : 'View All Notifications'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowThemeMenu(false);
                  setShowLanguageMenu(false);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-2xl bg-white/80 hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-200/50 group"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.full_name} 
                    className="w-10 h-10 rounded-xl object-cover shadow-md"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md ${roleInfo.color}`}>
                    {getUserAvatar()}
                  </div>
                )}
                
                <div className="hidden md:block text-left rtl:text-right">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {user?.full_name || user?.username}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs mr-1 rtl:ml-1 rtl:mr-0">{roleInfo.icon}</span>
                    <p className="text-xs text-gray-500 font-medium">
                      {roleInfo.label}
                    </p>
                  </div>
                </div>
                
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all duration-200 transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50">
                  {/* Enhanced User Info Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.full_name} 
                          className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${roleInfo.color}`}>
                          {getUserAvatar()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {user?.full_name || user?.username}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">{user?.email}</p>
                        <div className="flex items-center">
                          <span className="text-sm mr-2 rtl:ml-2 rtl:mr-0">{roleInfo.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${roleInfo.color} shadow-sm`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                        loadUserProfile();
                      }}
                      className="w-full flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 group-hover:bg-blue-200 transition-colors">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">{language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}</div>
                        <div className="text-xs text-gray-500">{language === 'ar' ? 'إدارة معلوماتك الشخصية' : 'Manage your personal information'}</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 group-hover:bg-green-200 transition-colors">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">{language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}</div>
                        <div className="text-xs text-gray-500">{language === 'ar' ? 'تخصيص تفضيلاتك' : 'Customize your preferences'}</div>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-6 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 group-hover:bg-red-200 transition-colors">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</div>
                        <div className="text-xs text-gray-500">{language === 'ar' ? 'إنهاء الجلسة الحالية' : 'End your current session'}</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200/50">
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'ar' ? 'الملف الشخصي' : 'User Profile'}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-600 font-medium">{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading profile...'}</span>
                  </div>
                </div>
              ) : userProfile ? (
                <div className="space-y-8">
                  {/* Enhanced Basic Info */}
                  <div className="flex items-center space-x-6 rtl:space-x-reverse p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                    {userProfile.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.full_name} 
                        className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg ${roleInfo.color}`}>
                        {getUserAvatar()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{userProfile.full_name}</h3>
                      <p className="text-gray-600 text-lg mb-2">{userProfile.email}</p>
                      <div className="flex items-center">
                        <span className="text-lg mr-2 rtl:ml-2 rtl:mr-0">{roleInfo.icon}</span>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${roleInfo.color} shadow-sm`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Profile Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                      </h4>
                      <div className="space-y-4">
                        {[
                          { label: language === 'ar' ? 'اسم المستخدم' : 'Username', value: userProfile.username },
                          { label: language === 'ar' ? 'الهاتف' : 'Phone', value: userProfile.phone || (language === 'ar' ? 'غير محدد' : 'Not provided') },
                          { label: language === 'ar' ? 'العنوان' : 'Address', value: userProfile.address || (language === 'ar' ? 'غير محدد' : 'Not provided') }
                        ].map((item, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-xl">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">{item.label}</label>
                            <p className="text-lg font-medium text-gray-800">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        {language === 'ar' ? 'معلومات العمل' : 'Work Information'}
                      </h4>
                      <div className="space-y-4">
                        {[
                          { label: language === 'ar' ? 'رقم الموظف' : 'Employee ID', value: userProfile.employee_id || (language === 'ar' ? 'غير مخصص' : 'Not assigned') },
                          { label: language === 'ar' ? 'القسم' : 'Department', value: userProfile.department || (language === 'ar' ? 'عام' : 'General') },
                          { 
                            label: language === 'ar' ? 'الحالة' : 'Status', 
                            value: userProfile.is_active ? 
                              (language === 'ar' ? 'نشط' : 'Active') : 
                              (language === 'ar' ? 'غير نشط' : 'Inactive'),
                            isStatus: true,
                            active: userProfile.is_active
                          }
                        ].map((item, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-xl">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">{item.label}</label>
                            {item.isStatus ? (
                              <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                                item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.value}
                              </span>
                            ) : (
                              <p className="text-lg font-medium text-gray-800">{item.value}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="border-t border-gray-200 pt-8 flex justify-end space-x-4 rtl:space-x-reverse">
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                    >
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg transform hover:scale-105">
                      {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">😔</div>
                  <p className="text-gray-500 text-lg">{language === 'ar' ? 'غير قادر على تحميل معلومات الملف الشخصي.' : 'Unable to load profile information.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernProfessionalHeader;