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

  // 7 Enhanced Professional Themes - محسن لراحة العين
  const themes = {
    glassy: {
      name: { ar: 'زجاجي', en: 'Glassy' },
      icon: '🔮',
      colors: {
        primary: 'rgba(71, 85, 105, 0.15)',
        secondary: 'rgba(59, 130, 246, 0.15)',
        accent: '#475569'
      }
    },
    dark: {
      name: { ar: 'داكن', en: 'Dark' },
      icon: '🌙',
      colors: {
        primary: 'rgba(30, 41, 59, 0.95)',
        secondary: 'rgba(51, 65, 85, 0.15)',
        accent: '#334155'
      }
    },
    golden: {
      name: { ar: 'ذهبي', en: 'Golden' },
      icon: '✨',
      colors: {
        primary: 'rgba(217, 119, 6, 0.12)',
        secondary: 'rgba(234, 88, 12, 0.12)',
        accent: '#d97706'
      }
    },
    modern: {
      name: { ar: 'حديث', en: 'Modern' },
      icon: '🚀',
      colors: {
        primary: 'rgba(79, 70, 229, 0.15)',
        secondary: 'rgba(147, 51, 234, 0.15)',
        accent: '#4f46e5'
      }
    },
    minimal: {
      name: { ar: 'بسيط', en: 'Minimal' },
      icon: '⚪',
      colors: {
        primary: 'rgba(243, 244, 246, 0.95)',
        secondary: 'rgba(156, 163, 175, 0.15)',
        accent: '#6b7280'
      }
    },
    professional: {
      name: { ar: 'مهني', en: 'Professional' },
      icon: '💼',
      colors: {
        primary: 'rgba(71, 85, 105, 0.95)',
        secondary: 'rgba(55, 65, 81, 0.15)',
        accent: '#475569'
      }
    },
    cosmic: {
      name: { ar: 'كوني', en: 'Cosmic' },
      icon: '🌌',
      colors: {
        primary: 'rgba(124, 58, 237, 0.15)',
        secondary: 'rgba(192, 38, 211, 0.15)',
        accent: '#7c3aed'
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
    <header className="professional-header fixed top-0 left-0 right-0 z-[9998] h-16 bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 backdrop-blur-lg border-b border-white/20">
      {/* Header Content - Simplified Layout */}
      <div className="h-full max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-full gap-4">
          {/* 1. Company Logo & Name (Right Side) */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-lg">EP</span>
            </div>
            
            {/* Company Name */}
            <div className="hidden md:block">
              <h1 className="text-white font-bold text-lg leading-tight">
                {systemSettings.site_name || 'نظام EP Group'}
              </h1>
              <p className="text-white/70 text-xs">
                {language === 'ar' ? 'نظام إدارة متقدم' : 'Advanced Management'}
              </p>
            </div>
          </div>

          {/* 2. Search Bar (Center) */}
          <div className="flex-1 max-w-md mx-4" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowAdvancedSearch(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery, searchType)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15"
                placeholder={language === 'ar' ? 'بحث في النظام...' : 'Search system...'}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                🔍
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showAdvancedSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl overflow-hidden z-[9999]">
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {searchTypes.slice(0, 4).map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSearchType(type.id)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                          searchType === type.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label[language]}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSearch(searchQuery, searchType)}
                    className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {language === 'ar' ? 'بحث' : 'Search'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Actions Section (Left Side) */}
          <div className="flex items-center gap-2">
            
            {/* Theme Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
                title={language === 'ar' ? 'تغيير المظهر' : 'Change Theme'}
              >
                <span className="text-lg">{currentTheme.icon}</span>
              </button>

              {/* Theme Dropdown - FIXED Z-INDEX */}
              {showThemeMenu && (
                <>
                  {/* Overlay to close menu */}
                  <div 
                    className="fixed inset-0 z-[9997]" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  
                  {/* Menu Content */}
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl overflow-hidden z-[9998]">
                    <div className="p-3">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>🎨</span>
                        {language === 'ar' ? 'اختر المظهر' : 'Choose Theme'}
                      </h3>
                      
                      <div className="space-y-2">
                        {Object.entries(themes).map(([themeKey, themeConfig]) => (
                          <button
                            key={themeKey}
                            onClick={() => handleThemeChange(themeKey)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              theme === themeKey
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border border-white/50"
                              style={{
                                background: `linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.secondary})`
                              }}
                            />
                            <span className="flex-1 text-left">
                              {themeConfig.icon} {themeConfig.name[language]}
                            </span>
                            {theme === themeKey && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={handleLanguageChange}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
              title={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
            >
              <span className="text-lg">{language === 'ar' ? '🇸🇦' : '🇺🇸'}</span>
            </button>

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border border-white/30">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                </div>
                
                {/* User Name - Hidden on small screens */}
                <div className="hidden lg:block text-left">
                  <div className="text-white font-medium text-sm">
                    {user?.full_name || user?.username || 'المستخدم'}
                  </div>
                </div>
                
                <span className="text-white/60 text-xs">▼</span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[9997]" 
                    onClick={() => setShowUserMenu(false)} 
                  />
                  
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl overflow-hidden z-[9998]">
                    
                    {/* Profile Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold border border-white/30">
                          {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold">{user?.full_name || user?.username}</h3>
                          <p className="text-white/80 text-sm">@{user?.username}</p>
                          <span className="inline-block px-2 py-1 bg-white/20 rounded text-xs font-medium mt-1">
                            {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Administrator') :
                             user?.role === 'medical_rep' ? (language === 'ar' ? 'مندوب طبي' : 'Medical Rep') :
                             (language === 'ar' ? 'مستخدم' : 'User')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 space-y-2">
                      <button className="w-full flex items-center gap-3 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span>👤</span>
                        <span className="text-gray-700">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                      </button>
                      
                      <button className="w-full flex items-center gap-3 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span>⚙️</span>
                        <span className="text-gray-700">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 text-left bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                      >
                        <span>🚪</span>
                        <span>{language === 'ar' ? 'تسجيل خروج' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;