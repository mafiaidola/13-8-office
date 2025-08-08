// Medical Management System - Professional Header Component
// Enhanced with Perfect Theme Integration

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
  systemSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef(null);
  const themeMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Available themes with proper Arabic names
  const availableThemes = {
    dark: { name: { ar: 'داكن كلاسيكي', en: 'Classic Dark' }, icon: '🌙' },
    midnight: { name: { ar: 'ليل عميق', en: 'Deep Night' }, icon: '🌃' },
    oceanic: { name: { ar: 'أزرق محيطي', en: 'Oceanic Blue' }, icon: '🌊' },
    royal: { name: { ar: 'بنفسجي ملكي', en: 'Royal Purple' }, icon: '👑' },
    forest: { name: { ar: 'أخضر الغابة', en: 'Forest Green' }, icon: '🌲' }
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchQuery(query);
    try {
      const results = await onSearch(query, 'all');
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    console.log(`🎨 Changing to theme: ${newTheme}`);
    setTheme(newTheme);
    setShowThemeMenu(false);
    
    // Apply theme immediately
    setTimeout(() => {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${newTheme}`);
      console.log(`✅ Theme applied: ${newTheme}`);
    }, 50);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.reload();
  };

  return (
    <header className="professional-header">
      {/* Logo Section */}
      <div className="logo">
        <span className="text-2xl">🏥</span>
        <div className="flex flex-col">
          <span className="font-bold text-lg">نظام شامل للإدارة</span>
          <span className="text-xs opacity-75">Comprehensive Management System</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-container" ref={searchRef}>
        <input
          type="text"
          placeholder={language === 'ar' ? 'البحث في النظام...' : 'Search system...'}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="search-result-item"
                onClick={() => {
                  console.log('Search result clicked:', result);
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{result.icon}</span>
                  <div>
                    <div className="font-medium" style={{color: 'var(--text-primary)'}}>{result.title}</div>
                    <div className="text-sm" style={{color: 'var(--text-secondary)'}}>{result.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <button
          onClick={() => {
            const newLanguage = language === 'ar' ? 'en' : 'ar';
            setLanguage(newLanguage);
            setIsRTL(newLanguage === 'ar');
          }}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          title={language === 'ar' ? 'English' : 'عربي'}
        >
          {language === 'ar' ? 'EN' : 'ع'}
        </button>

        {/* Theme Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="theme-selector-enhanced"
            title={language === 'ar' ? 'تغيير المظهر' : 'Change Theme'}
          >
            <span className="text-xl">🎨</span>
          </button>

          {/* Theme Menu */}
          {showThemeMenu && (
            <>
              {/* Overlay */}
              <div 
                className="theme-dropdown-overlay"
                onClick={() => setShowThemeMenu(false)}
              />
              
              {/* Theme Options */}
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="font-semibold text-gray-900 text-sm">
                    {language === 'ar' ? 'اختر المظهر' : 'Choose Theme'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {language === 'ar' ? 'المظهر الحالي:' : 'Current:'} {availableThemes[theme]?.name[language]}
                  </div>
                </div>
                
                <div className="py-1">
                  {Object.entries(availableThemes).map(([themeKey, themeData]) => (
                    <button
                      key={themeKey}
                      onClick={() => handleThemeChange(themeKey)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                        theme === themeKey ? 'bg-blue-50' : ''
                      }`}
                      style={{color: theme === themeKey ? 'var(--primary-color)' : 'var(--text-primary)'}}
                    >
                      <span className="text-lg">{themeData.icon}</span>
                      <div>
                        <div className="font-medium">
                          {themeData.name[language]}
                        </div>
                        {theme === themeKey && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            {language === 'ar' ? 'نشط الآن' : 'Currently Active'}
                          </div>
                        )}
                      </div>
                      {theme === themeKey && (
                        <div className="mr-auto">
                          <span className="text-blue-600 text-sm">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative user-menu" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{user?.full_name || user?.username}</div>
              <div className="text-xs opacity-75">
                {language === 'ar' ? 
                  (user?.role === 'admin' ? 'مدير النظام' : user?.role) : 
                  user?.role
                }
              </div>
            </div>
            <span className="text-sm opacity-75">▼</span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="dropdown">
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    console.log('Profile clicked');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm"
                  style={{color: 'var(--text-primary)'}}
                >
                  {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    console.log('Settings clicked');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm"
                  style={{color: 'var(--text-primary)'}}
                >
                  {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 text-sm font-medium"
                >
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;