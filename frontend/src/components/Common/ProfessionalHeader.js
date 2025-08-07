// Professional Header Component - هيدر احترافي محسن - FIXED ALL ISSUES
import React, { useState, useEffect, useRef } from 'react';
import NotificationCenter from './NotificationCenter';

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



  // Advanced Professional Themes - ثيمات احترافية متطورة
  const themes = {
    dark: {
      name: { ar: 'داكن كلاسيكي', en: 'Classic Dark' },
      colors: {
        background: '#0f172a',
        card: '#1e293b',
        text: '#ffffff'
      }
    },
    midnight: {
      name: { ar: 'ليل عميق', en: 'Deep Night' },
      colors: {
        background: '#030712',
        card: '#111827',
        text: '#ffffff'
      }
    },
    oceanic: {
      name: { ar: 'أزرق محيطي', en: 'Oceanic Blue' },
      colors: {
        background: '#0c4a6e',
        card: '#075985',
        text: '#ffffff'
      }
    },
    royal: {
      name: { ar: 'بنفسجي ملكي', en: 'Royal Purple' },
      colors: {
        background: '#4c1d95',
        card: '#6b21a8',
        text: '#ffffff'
      }
    },
    forest: {
      name: { ar: 'أخضر الغابة', en: 'Forest Green' },
      colors: {
        background: '#14532d',
        card: '#166534',
        text: '#ffffff'
      }
    }
  };

  const currentTheme = themes[theme] || themes.dark;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close theme menu if clicked outside
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      
      // Close user menu if clicked outside
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      
      // Close search results if clicked outside
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setShowAdvancedSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle theme change with advanced styling
  const handleThemeChange = (newTheme) => {
    console.log('🎨 Changing to advanced theme:', newTheme);
    
    // Apply theme to document body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${newTheme}`);
    
    // Update theme state
    if (setTheme && typeof setTheme === 'function') {
      setTheme(newTheme);
    }
    
    // Apply advanced theme colors
    const themeConfig = themes[newTheme];
    if (themeConfig) {
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', themeConfig.colors.background);
      root.style.setProperty('--bg-card', themeConfig.colors.card);
      root.style.setProperty('--text-primary', themeConfig.colors.text);
      
      // Advanced gradient background
      document.body.style.background = `linear-gradient(135deg, ${themeConfig.colors.background}, ${themeConfig.colors.card})`;
    }
    
    // Store theme preference
    localStorage.setItem('selectedTheme', newTheme);
    
    // Close theme menu
    setShowThemeMenu(false);
    
    console.log('✅ Advanced theme applied successfully');
  };

  // Enhanced Search Functionality - FIXED
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Call parent search handler if provided
    if (onSearch && typeof onSearch === 'function') {
      try {
        const results = await onSearch(query, searchType);
        if (Array.isArray(results)) {
          setSearchResults(results.slice(0, 5)); // Limit to 5 results
        }
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to basic search results
        setSearchResults([
          {
            id: 1,
            title: `نتائج البحث عن: ${query}`,
            type: 'general',
            description: 'نتائج البحث العامة'
          }
        ]);
      }
    } else {
      // Fallback search results
      setSearchResults([
        {
          id: 1,
          title: `بحث عن: ${query}`,
          type: 'general',
          description: 'ابحث في المستخدمين والعيادات والطلبات'
        }
      ]);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    console.log('🌐 Changing language to:', newLanguage);
    
    if (setLanguage && typeof setLanguage === 'function') {
      setLanguage(newLanguage);
    }
    
    const newIsRTL = newLanguage === 'ar';
    if (setIsRTL && typeof setIsRTL === 'function') {
      setIsRTL(newIsRTL);
    }
    
    // Update document direction
    document.documentElement.dir = newIsRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
    
    // Store language preference
    localStorage.setItem('selectedLanguage', newLanguage);
    localStorage.setItem('isRTL', newIsRTL.toString());
    
    console.log('✅ Language changed successfully');
  };

  // Handle logout
  const handleLogout = () => {
    console.log('🚪 Logging out user');
    
    // Clear all localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedLanguage');
    localStorage.removeItem('selectedTheme');
    localStorage.removeItem('isRTL');
    
    // Redirect to login
    window.location.href = '/';
  };

  return (
    <header className="professional-header">
      {/* Logo Section */}
      <div className="logo">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">EP Group</span>
            <span className="text-xs opacity-75">
              {language === 'ar' ? 'نظام إدارة شامل' : 'Complete Management System'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section - FIXED */}
      <div className="search-container" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث في النظام...' : 'Search system...'}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
          
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* Search Results Dropdown - FIXED Z-INDEX */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className="search-result-item"
                  onClick={() => {
                    console.log('🔍 Search result clicked:', result);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <div className="font-medium text-gray-900">{result.title}</div>
                  <div className="text-sm text-gray-500">{result.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <NotificationCenter 
          language={language}
          user={user}
        />

        {/* Advanced Theme Selector - محدد الثيمات المتطور */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => {
              console.log('🎨 Advanced theme selector opened');
              setShowThemeMenu(!showThemeMenu);
            }}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300"
            title={language === 'ar' ? 'اختر الثيم المفضل' : 'Choose Your Preferred Theme'}
          >
            <span className="text-2xl">🎨</span>
          </button>

          {/* Advanced Theme Dropdown */}
          {showThemeMenu && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                style={{ zIndex: 99998 }}
                onClick={() => setShowThemeMenu(false)} 
              />
              
              {/* Theme Menu */}
              <div className="absolute top-full right-0 mt-3 w-80 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
                   style={{ zIndex: 99999 }}>
                <div className="p-6">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-3 text-lg">
                    <span className="text-2xl">🎨</span>
                    {language === 'ar' ? 'اختر الثيم المفضل' : 'Choose Your Theme'}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(themes).map(([themeKey, themeConfig]) => (
                      <button
                        key={themeKey}
                        onClick={() => {
                          console.log('🎨 Advanced theme selected:', themeKey);
                          handleThemeChange(themeKey);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                          theme === themeKey
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                            : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-lg hover:scale-102'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg border-2 border-white/50 shadow-md flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${themeConfig.colors.background}, ${themeConfig.colors.card})`
                          }}
                        />
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">
                            {themeConfig.name[language]}
                          </div>
                          <div className="text-sm opacity-75 mt-1">
                            {language === 'ar' ? 'ثيم احترافي متطور' : 'Advanced Professional Theme'}
                          </div>
                        </div>
                        {theme === themeKey && (
                          <div className="text-xl">✨</div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="text-xs text-white/60 text-center flex items-center justify-center gap-2">
                      <span>🌟</span>
                      {language === 'ar' ? 'ثيمات احترافية محسنة للعين' : 'Professional Eye-Optimized Themes'}
                      <span>🌟</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Language Selector */}
        <button
          onClick={() => handleLanguageChange(language === 'ar' ? 'en' : 'ar')}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300"
          title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <span className="text-lg font-bold">
            {language === 'ar' ? '🇺🇸 EN' : '🇸🇦 ع'}
          </span>
        </button>

        {/* User Menu - FIXED Z-INDEX */}
        <div className="user-menu relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300"
            title={language === 'ar' ? 'قائمة المستخدم' : 'User Menu'}
          >
            <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-white">
                {user?.full_name || user?.username || 'User'}
              </span>
              <span className="text-xs text-white/70">
                {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Admin') :
                 user?.role === 'medical_rep' ? (language === 'ar' ? 'مندوب طبي' : 'Medical Rep') :
                 user?.role || (language === 'ar' ? 'مستخدم' : 'User')}
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Dropdown Menu - FIXED Z-INDEX */}
          {showUserMenu && (
            <>
              {/* Overlay to close menu */}
              <div 
                className="fixed inset-0"
                style={{ zIndex: 9998 }}
                onClick={() => setShowUserMenu(false)} 
              />
              
              {/* Menu Content */}
              <div className="dropdown" style={{ zIndex: 9999 }}>
                <div className="space-y-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="font-medium text-gray-900">
                      {user?.full_name || user?.username || 'User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        console.log('👤 Profile clicked');
                        setShowUserMenu(false);
                      }}
                    >
                      <span>👤</span>
                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </button>
                    
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        console.log('⚙️ Settings clicked');
                        setShowUserMenu(false);
                      }}
                    >
                      <span>⚙️</span>
                      {language === 'ar' ? 'الإعدادات' : 'Settings'}
                    </button>
                    
                    <div className="border-t border-gray-200 pt-1">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={handleLogout}
                      >
                        <span>🚪</span>
                        {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;