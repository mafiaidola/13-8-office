// Professional Header Component - هيدر احترافي متقدم
import React, { useState, useEffect, useRef } from 'react';

const ProfessionalHeader = ({ 
  user, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  isRTL, 
  setIsRTL,
  onSearch,
  systemSettings = {}
}) => {
  // States
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  
  // Refs for click outside detection
  const themeMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // 7 Professional Themes Configuration
  const themes = {
    glassy: {
      name: { ar: 'زجاجي', en: 'Glassy' },
      icon: '🔮',
      colors: {
        primary: 'rgba(59, 130, 246, 0.1)',
        secondary: 'rgba(139, 92, 246, 0.1)',
        accent: '#3b82f6'
      }
    },
    dark: {
      name: { ar: 'داكن', en: 'Dark' },
      icon: '🌙',
      colors: {
        primary: 'rgba(31, 41, 55, 0.95)',
        secondary: 'rgba(67, 56, 202, 0.1)',
        accent: '#4338ca'
      }
    },
    golden: {
      name: { ar: 'ذهبي', en: 'Golden' },
      icon: '✨',
      colors: {
        primary: 'rgba(245, 158, 11, 0.1)',
        secondary: 'rgba(251, 191, 36, 0.1)',
        accent: '#f59e0b'
      }
    },
    modern: {
      name: { ar: 'حديث', en: 'Modern' },
      icon: '🚀',
      colors: {
        primary: 'rgba(59, 130, 246, 0.1)',
        secondary: 'rgba(139, 92, 246, 0.1)',
        accent: '#3b82f6'
      }
    },
    minimal: {
      name: { ar: 'بسيط', en: 'Minimal' },
      icon: '⚪',
      colors: {
        primary: 'rgba(243, 244, 246, 0.95)',
        secondary: 'rgba(156, 163, 175, 0.1)',
        accent: '#6b7280'
      }
    },
    professional: {
      name: { ar: 'مهني', en: 'Professional' },
      icon: '💼',
      colors: {
        primary: 'rgba(15, 23, 42, 0.95)',
        secondary: 'rgba(30, 41, 59, 0.1)',
        accent: '#1e293b'
      }
    },
    neon: {
      name: { ar: 'نيون', en: 'Neon' },
      icon: '⚡',
      colors: {
        primary: 'rgba(255, 102, 0, 0.1)',
        secondary: 'rgba(255, 153, 0, 0.1)',
        accent: '#ff6600'
      }
    }
  };

  // Search types configuration
  const searchTypes = [
    { id: 'all', label: { ar: 'بحث شامل', en: 'All Search' }, icon: '🔍' },
    { id: 'invoice', label: { ar: 'رقم الفاتورة', en: 'Invoice Number' }, icon: '📄' },
    { id: 'clinic', label: { ar: 'اسم العيادة', en: 'Clinic Name' }, icon: '🏥' },
    { id: 'doctor', label: { ar: 'اسم الطبيب', en: 'Doctor Name' }, icon: '👨‍⚕️' },
    { id: 'area', label: { ar: 'اسم المنطقة', en: 'Area Name' }, icon: '📍' },
    { id: 'user', label: { ar: 'اسم المستخدم', en: 'User Name' }, icon: '👤' }
  ];

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowAdvancedSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = async (query, type) => {
    if (!query.trim()) return;
    
    try {
      // Call parent search function
      if (onSearch) {
        const results = await onSearch(query, type);
        setSearchResults(results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle theme change
  const handleThemeChange = (themeKey) => {
    setTheme(themeKey);
    setShowThemeMenu(false);
    
    // Apply theme immediately
    document.body.className = `theme-${themeKey}`;
    
    // Store in localStorage
    localStorage.setItem('selectedTheme', themeKey);
  };

  // Handle language change
  const handleLanguageChange = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    setIsRTL(newLanguage === 'ar');
    localStorage.setItem('language', newLanguage);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedTheme');
    window.location.reload();
  };

  const currentTheme = themes[theme] || themes.modern;

  return (
    <header className="professional-header fixed top-0 left-0 right-0 z-[9998] h-20">
      {/* Header Background with Glassmorphism */}
      <div 
        className="absolute inset-0 backdrop-blur-xl border-b border-white/10"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      />

      {/* Header Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          
          {/* 1. Logo & Site Name (Right Side in RTL) */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="logo-container flex items-center">
              {systemSettings.company_logo ? (
                <img 
                  src={systemSettings.company_logo} 
                  alt="Company Logo" 
                  className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1 border border-white/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border border-white/20">
                  EP
                </div>
              )}
              
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <h1 className="text-xl font-bold text-white">
                  {systemSettings.site_name || (language === 'ar' ? 'نظام EP Group' : 'EP Group System')}
                </h1>
                <p className="text-xs text-white/70">
                  {language === 'ar' ? 'نظام إدارة متقدم' : 'Advanced Management System'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Advanced Search */}
          <div className="flex-1 max-w-xl mx-8" ref={searchRef}>
            <div className="relative">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none">
                  <span className="text-white/60 text-lg">🔍</span>
                </div>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowAdvancedSearch(true)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery, searchType);
                    }
                  }}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 transition-all duration-200"
                  placeholder={language === 'ar' ? 'بحث متقدم في النظام...' : 'Advanced search in system...'}
                />
                
                <button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-white/60 hover:text-white transition-colors"
                >
                  <span className="text-lg">⚙️</span>
                </button>
              </div>

              {/* Advanced Search Dropdown */}
              {showAdvancedSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
                  
                  {/* Search Types */}
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                      {language === 'ar' ? 'نوع البحث' : 'Search Type'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {searchTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSearchType(type.id)}
                          className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg text-sm transition-all ${
                            searchType === type.id
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{type.icon}</span>
                          <span>{type.label[language]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Search Actions */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSearch(searchQuery, searchType)}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <span>🔍</span>
                        <span>{language === 'ar' ? 'بحث' : 'Search'}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <span>🗑️</span>
                        <span>{language === 'ar' ? 'مسح' : 'Clear'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Results Preview */}
                  {searchResults.length > 0 && (
                    <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <h4 className="text-xs font-semibold text-gray-600 mb-2 px-2">
                          {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                        </h4>
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <span className="text-lg">{result.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{result.title}</div>
                              <div className="text-xs text-gray-500">{result.subtitle}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Left Section - Theme, Language, User */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            
            {/* 3. Theme Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all duration-200 group"
              >
                <span className="text-lg">{currentTheme.icon}</span>
                <span className="hidden sm:inline text-white font-medium">
                  {currentTheme.name[language]}
                </span>
                <span className="text-white/60 text-xs group-hover:text-white transition-colors">▼</span>
              </button>

              {/* Theme Dropdown */}
              {showThemeMenu && (
                <div 
                  className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <span className="mr-2">🎨</span>
                      {language === 'ar' ? 'اختر المظهر' : 'Choose Theme'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'ar' ? 'اختر مظهراً يناسب أسلوبك' : 'Choose a theme that suits your style'}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(themes).map(([themeKey, themeConfig]) => (
                        <button
                          key={themeKey}
                          onClick={() => handleThemeChange(themeKey)}
                          className={`flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition-all group ${
                            theme === themeKey
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.secondary})`
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 text-left rtl:text-right">
                            <div className="font-semibold">
                              {themeConfig.icon} {themeConfig.name[language]}
                            </div>
                            <div className={`text-xs ${theme === themeKey ? 'text-white/80' : 'text-gray-500'}`}>
                              {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)} theme
                            </div>
                          </div>
                          
                          {theme === themeKey && (
                            <div className="text-white text-xl">✓</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Language Selector */}
            <button
              onClick={handleLanguageChange}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all duration-200"
            >
              <span className="text-lg">{language === 'ar' ? '🇸🇦' : '🇺🇸'}</span>
              <span className="hidden sm:inline text-white font-medium">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
            </button>

            {/* 5. User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all duration-200 group"
              >
                {/* User Avatar */}
                <div className="relative">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* User Name */}
                <div className="hidden lg:block text-left rtl:text-right">
                  <div className="text-white font-medium text-sm">
                    {user?.full_name || user?.username || 'المستخدم'}
                  </div>
                  <div className="text-white/60 text-xs">
                    {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Administrator') :
                     user?.role === 'medical_rep' ? (language === 'ar' ? 'مندوب طبي' : 'Medical Rep') :
                     user?.role === 'accountant' ? (language === 'ar' ? 'محاسب' : 'Accountant') :
                     (language === 'ar' ? 'مستخدم' : 'User')}
                  </div>
                </div>

                <span className="text-white/60 text-xs group-hover:text-white transition-colors">▼</span>
              </button>

              {/* User Dropdown - Mini Profile */}
              {showUserMenu && (
                <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
                  
                  {/* Profile Header */}
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="relative">
                        {user?.photo ? (
                          <img
                            src={user.photo}
                            alt={user.full_name}
                            className="w-16 h-16 rounded-full object-cover border-3 border-white/30 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-3 border-white/30 shadow-lg">
                            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white"></div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{user?.full_name || user?.username}</h3>
                        <p className="text-white/80 text-sm">@{user?.username}</p>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                            {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Administrator') :
                             user?.role === 'medical_rep' ? (language === 'ar' ? 'مندوب طبي' : 'Medical Rep') :
                             user?.role === 'accountant' ? (language === 'ar' ? 'محاسب' : 'Accountant') :
                             (language === 'ar' ? 'مستخدم' : 'User')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {user?.stats?.visits || 0}
                        </div>
                        <div className="text-gray-600">
                          {language === 'ar' ? 'الزيارات' : 'Visits'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {user?.stats?.orders || 0}
                        </div>
                        <div className="text-gray-600">
                          {language === 'ar' ? 'الطلبات' : 'Orders'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4">
                    <div className="space-y-2">
                      <button className="w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 text-left rtl:text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                        <span className="text-lg">👤</span>
                        <span className="flex-1 text-gray-700 group-hover:text-gray-900">
                          {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
                        </span>
                        <span className="text-gray-400 group-hover:text-gray-600">→</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 text-left rtl:text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                        <span className="text-lg">⚙️</span>
                        <span className="flex-1 text-gray-700 group-hover:text-gray-900">
                          {language === 'ar' ? 'الإعدادات' : 'Settings'}
                        </span>
                        <span className="text-gray-400 group-hover:text-gray-600">→</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 text-left rtl:text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                        <span className="text-lg">🔔</span>
                        <span className="flex-1 text-gray-700 group-hover:text-gray-900">
                          {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </span>
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                      </button>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 text-left rtl:text-right bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg transition-colors group"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="flex-1 font-medium">
                        {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
                      </span>
                      <span className="text-red-400 group-hover:text-red-600">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;