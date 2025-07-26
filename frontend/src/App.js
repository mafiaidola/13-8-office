import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context with Language Support
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'ar'; // Arabic as default
  });

  // Available themes
  const availableThemes = ['light', 'dark', 'minimal', 'modern', 'fancy'];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    // Apply theme to document element and body
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    // Force theme variables update
    updateThemeVariables(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
    // Apply direction based on language
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const updateThemeVariables = (currentTheme) => {
    const root = document.documentElement;
    
    // Base colors for all themes
    const themeConfigs = {
      light: {
        '--primary-bg': '#ffffff',
        '--secondary-bg': '#f8fafc',
        '--accent-bg': '#e2e8f0',
        '--card-bg': 'rgba(255, 255, 255, 0.95)',
        '--glass-bg': 'rgba(248, 250, 252, 0.8)',
        '--text-primary': '#1e293b',
        '--text-secondary': '#475569',
        '--text-muted': '#64748b',
        '--gradient-dark': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
        '--border-color': '#e2e8f0',
        '--hover-bg': 'rgba(0, 0, 0, 0.05)',
        '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        '--primary-color': '#3b82f6',
        '--success-color': '#10b981',
        '--warning-color': '#f59e0b',
        '--error-color': '#ef4444'
      },
      dark: {
        '--primary-bg': '#0f172a',
        '--secondary-bg': '#1e293b',
        '--accent-bg': '#334155',
        '--card-bg': 'rgba(30, 41, 59, 0.95)',
        '--glass-bg': 'rgba(15, 23, 42, 0.8)',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        '--border-color': '#334155',
        '--hover-bg': 'rgba(255, 255, 255, 0.05)',
        '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        '--primary-color': '#60a5fa',
        '--success-color': '#34d399',
        '--warning-color': '#fbbf24',
        '--error-color': '#f87171'
      },
      minimal: {
        '--primary-bg': '#fefefe',
        '--secondary-bg': '#f9f9f9',
        '--accent-bg': '#f0f0f0',
        '--card-bg': 'rgba(255, 255, 255, 0.98)',
        '--glass-bg': 'rgba(249, 249, 249, 0.95)',
        '--text-primary': '#333333',
        '--text-secondary': '#666666',
        '--text-muted': '#999999',
        '--gradient-dark': 'linear-gradient(135deg, #fefefe 0%, #f9f9f9 100%)',
        '--border-color': '#e0e0e0',
        '--hover-bg': 'rgba(0, 0, 0, 0.03)',
        '--shadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
        '--primary-color': '#4a5568',
        '--success-color': '#48bb78',
        '--warning-color': '#ed8936',
        '--error-color': '#e53e3e'
      },
      modern: {
        '--primary-bg': '#0a0a0a',
        '--secondary-bg': '#1a1a1a',
        '--accent-bg': '#2d2d2d',
        '--card-bg': 'rgba(26, 26, 26, 0.95)',
        '--glass-bg': 'rgba(10, 10, 10, 0.8)',
        '--text-primary': '#ffffff',
        '--text-secondary': '#a0a0a0',
        '--text-muted': '#707070',
        '--gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
        '--border-color': '#404040',
        '--hover-bg': 'rgba(255, 255, 255, 0.08)',
        '--shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
        '--primary-color': '#00d4ff',
        '--success-color': '#00ff88',
        '--warning-color': '#ffaa00',
        '--error-color': '#ff4757'
      },
      fancy: {
        '--primary-bg': '#1a1a2e',
        '--secondary-bg': '#16213e',
        '--accent-bg': '#0f3460',
        '--card-bg': 'rgba(22, 33, 62, 0.95)',
        '--glass-bg': 'rgba(26, 26, 46, 0.8)',
        '--text-primary': '#eee6ff',
        '--text-secondary': '#b8b5ff',
        '--text-muted': '#8a87ff',
        '--gradient-dark': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        '--border-color': '#533483',
        '--hover-bg': 'rgba(238, 230, 255, 0.1)',
        '--shadow': '0 8px 32px rgba(83, 52, 131, 0.3)',
        '--primary-color': '#bb86fc',
        '--success-color': '#4ade80',
        '--warning-color': '#fbbf24',
        '--error-color': '#f87171'
      }
    };

    const config = themeConfigs[currentTheme] || themeConfigs.dark;
    
    // Apply theme variables
    Object.entries(config).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add special effects for fancy theme
    if (currentTheme === 'fancy') {
      root.style.setProperty('--glow-primary', '0 0 20px rgba(187, 134, 252, 0.5)');
      root.style.setProperty('--glow-secondary', '0 0 10px rgba(184, 181, 255, 0.3)');
    } else {
      root.style.setProperty('--glow-primary', 'none');
      root.style.setProperty('--glow-secondary', 'none');
    }
  };

  const cycleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const newTheme = availableThemes[nextIndex];
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    updateThemeVariables(newTheme);
  };

  const setSpecificTheme = (newTheme) => {
    if (availableThemes.includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.setAttribute('data-theme', newTheme);
      updateThemeVariables(newTheme);
    }
  };

  // Legacy support for toggleTheme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setSpecificTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      cycleTheme,
      setSpecificTheme,
      availableThemes,
      language, 
      setLanguage 
    }}>
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// SVG Icons Component
const SVGIcon = ({ name, size = 24, className = "", animated = true }) => {
  const baseClass = `svg-icon ${animated ? 'svg-icon-animated' : ''} ${className}`;
  
  const icons = {
    theme: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10zM14 9a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1h-6a1 1 0 01-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    warehouse: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM12 7.5V15M8.25 15h7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    visits: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    reports: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chat: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    notification: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    moon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    sun: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={baseClass}>
        <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };

  return icons[name] || icons.theme;
};

// Global Search Component
const GlobalSearch = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const searchTypes = [
    { value: 'all', label: 'البحث الشامل', icon: 'search' },
    { value: 'representative', label: 'المناديب', icon: 'user' },
    { value: 'doctor', label: 'الأطباء', icon: 'user' },
    { value: 'clinic', label: 'العيادات', icon: 'warehouse' },
    { value: 'invoice', label: 'الفواتير', icon: 'reports' },
    { value: 'product', label: 'المنتجات', icon: 'warehouse' }
  ];

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/search/comprehensive`, {
        params: {
          q: searchQuery,
          search_type: searchType
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>جاري البحث...</p>
        </div>
      );
    }

    if (!searchResults || Object.keys(searchResults).length === 0) {
      return (
        <div className="text-center py-8">
          <SVGIcon name="search" size={48} className="mx-auto mb-4 text-gray-400" />
          <p style={{ color: 'var(--text-secondary)' }}>ابدأ البحث للحصول على النتائج</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Representatives Results */}
        {searchResults.representatives && searchResults.representatives.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="user" size={24} />
              <span>المناديب ({searchResults.representatives.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.representatives.map((rep) => (
                <div key={rep.id} className="card-modern p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {rep.photo ? (
                        <img src={rep.photo} alt={rep.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        rep.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{rep.name}</h4>
                        <span className="text-sm px-2 py-1 bg-blue-100 rounded-full">مندوب</span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {rep.username} • {rep.email}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">الزيارات:</span> {rep.statistics?.visits?.total || 0}
                        </div>
                        <div>
                          <span className="font-semibold">الطلبات:</span> {rep.statistics?.orders?.total || 0}
                        </div>
                        <div>
                          <span className="font-semibold">التارجيت:</span> {rep.statistics?.target || 0} ج.م
                        </div>
                        <div>
                          <span className="font-semibold">المديونية:</span> {rep.statistics?.pending_debt || 0} ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctors Results */}
        {searchResults.doctors && searchResults.doctors.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="user" size={24} />
              <span>الأطباء ({searchResults.doctors.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.doctors.map((doctor) => (
                <div key={doctor.id} className="card-modern p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      د.{doctor.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">د. {doctor.name}</h4>
                        <span className="text-sm px-2 py-1 bg-green-100 rounded-full">طبيب</span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {doctor.specialty} • {doctor.phone}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">العيادة:</span> {doctor.clinic?.name || 'غير محدد'}
                        </div>
                        <div>
                          <span className="font-semibold">الطلبات:</span> {doctor.total_orders || 0}
                        </div>
                        <div>
                          <span className="font-semibold">المديونية:</span> {doctor.pending_debt || 0} ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinics Results */}
        {searchResults.clinics && searchResults.clinics.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="warehouse" size={24} />
              <span>العيادات ({searchResults.clinics.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.clinics.map((clinic) => (
                <div key={clinic.id} className="card-modern p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {clinic.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{clinic.name}</h4>
                        <span className="text-sm px-2 py-1 bg-purple-100 rounded-full">عيادة</span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {clinic.address} • {clinic.phone}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">المدير:</span> {clinic.manager_name || 'غير محدد'}
                        </div>
                        <div>
                          <span className="font-semibold">الأطباء:</span> {clinic.doctors?.length || 0}
                        </div>
                        <div>
                          <span className="font-semibold">الطلبات:</span> {clinic.total_orders || 0}
                        </div>
                        <div>
                          <span className="font-semibold">المديونية:</span> {clinic.pending_debt || 0} ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices Results */}
        {searchResults.invoices && searchResults.invoices.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="reports" size={24} />
              <span>الفواتير ({searchResults.invoices.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="card-modern p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openInvoiceModal(invoice)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      #
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">فاتورة #{invoice.id.slice(-8)}</h4>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          invoice.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {invoice.sales_rep_name} • {invoice.doctor_name} • {invoice.clinic_name}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">التاريخ:</span> {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                        </div>
                        <div>
                          <span className="font-semibold">القيمة:</span> {invoice.total_amount} ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Results */}
        {searchResults.products && searchResults.products.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="warehouse" size={24} />
              <span>المنتجات ({searchResults.products.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.products.map((product) => (
                <div key={product.id} className="card-modern p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{product.name}</h4>
                        <span className="text-sm px-2 py-1 bg-indigo-100 rounded-full">منتج</span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {product.description} • {product.category}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">السعر:</span> {product.price} ج.م
                        </div>
                        <div>
                          <span className="font-semibold">الوحدة:</span> {product.unit}
                        </div>
                        <div>
                          <span className="font-semibold">تم طلبه:</span> {product.total_ordered || 0} مرة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gradient">البحث الشامل</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SVGIcon name="close" size={24} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="ابحث عن مندوب، طبيب، عيادة، رقم فاتورة، أو منتج..."
                className="w-full p-3 pr-12 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ 
                  background: 'var(--secondary-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <div className="absolute right-3 top-3">
                <SVGIcon name="search" size={20} />
              </div>
            </div>
            <button
              onClick={performSearch}
              className="btn-primary px-6 py-3 flex items-center gap-2"
              disabled={loading}
            >
              <SVGIcon name="search" size={18} />
              بحث
            </button>
          </div>

          {/* Search Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {searchTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSearchType(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  searchType === type.value 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <SVGIcon name={type.icon} size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderSearchResults()}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}
    </div>
  );
};

// Invoice Modal Component
const InvoiceModal = ({ invoice, onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-xl font-bold">فاتورة رقم #{invoice.id.slice(-8)}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <SVGIcon name="print" size={16} />
              طباعة
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SVGIcon name="close" size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto" id="invoice-content">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">تفاصيل الفاتورة</h4>
                <p><strong>رقم الفاتورة:</strong> #{invoice.id.slice(-8)}</p>
                <p><strong>التاريخ:</strong> {new Date(invoice.created_at).toLocaleDateString('ar-EG')}</p>
                <p><strong>الحالة:</strong> {invoice.status}</p>
                <p><strong>القيمة الإجمالية:</strong> {invoice.total_amount} ج.م</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">تفاصيل العميل</h4>
                <p><strong>المندوب:</strong> {invoice.sales_rep_name}</p>
                <p><strong>الطبيب:</strong> د. {invoice.doctor_name}</p>
                <p><strong>العيادة:</strong> {invoice.clinic_name}</p>
                <p><strong>المخزن:</strong> {invoice.warehouse_name}</p>
              </div>
            </div>

            {invoice.items && invoice.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">تفاصيل المنتجات</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-right">المنتج</th>
                        <th className="border border-gray-300 p-2 text-right">الكمية</th>
                        <th className="border border-gray-300 p-2 text-right">السعر</th>
                        <th className="border border-gray-300 p-2 text-right">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{item.product_name}</td>
                          <td className="border border-gray-300 p-2">{item.quantity}</td>
                          <td className="border border-gray-300 p-2">{item.unit_price} ج.م</td>
                          <td className="border border-gray-300 p-2">{item.quantity * item.unit_price} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div>
                <h4 className="font-semibold mb-2">ملاحظات</h4>
                <p>{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Theme Toggle Component
const ThemeToggle = ({ showLabel = false, isDropdown = false }) => {
  const { theme, cycleTheme, availableThemes, setSpecificTheme } = useTheme();
  
  const getThemeIcon = (themeName) => {
    const icons = {
      light: 'sun',
      dark: 'moon',
      minimal: 'theme',
      modern: 'theme',
      fancy: 'theme'
    };
    return icons[themeName] || 'theme';
  };

  const getThemeLabel = (themeName) => {
    const labels = {
      light: 'فاتح',
      dark: 'داكن',
      minimal: 'بسيط',
      modern: 'عصري',
      fancy: 'فاخر'
    };
    return labels[themeName] || themeName;
  };

  if (isDropdown) {
    return (
      <div className="relative group">
        <button
          className="theme-toggle flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-10 transition-all duration-200"
          title={`الثيم الحالي: ${getThemeLabel(theme)}`}
        >
          <SVGIcon name={getThemeIcon(theme)} size={20} />
          {showLabel && <span>{getThemeLabel(theme)}</span>}
        </button>
        
        <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {availableThemes.map((themeName) => (
            <button
              key={themeName}
              onClick={() => setSpecificTheme(themeName)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-right hover:bg-gray-100 hover:bg-opacity-20 transition-colors ${
                theme === themeName ? 'bg-blue-500 bg-opacity-20' : ''
              }`}
            >
              <SVGIcon name={getThemeIcon(themeName)} size={16} />
              <span>{getThemeLabel(themeName)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="theme-toggle flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-10 transition-all duration-200"
      title={`الثيم الحالي: ${getThemeLabel(theme)} - اضغط للتبديل`}
    >
      <SVGIcon name={getThemeIcon(theme)} size={20} />
      {showLabel && <span>{getThemeLabel(theme)}</span>}
    </button>
  );
};

// Theme Toggle Component (Legacy)
const ThemeToggleOld = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      {theme === 'dark' ? 'داكن' : 'فاتح'}
    </button>
  );
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'حدث خطأ في تسجيل الدخول'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
// Enhanced Login Page with Logo Support
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const { login } = useAuth();

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="floating">
          <div className="card-modern w-full max-w-md p-8 fade-in-up glass-effect">
            <div className="text-center mb-8">
              {/* Logo Section */}
              <div className="mb-6">
                {systemSettings?.logo_image ? (
                  <img 
                    src={systemSettings.logo_image} 
                    alt="شعار الشركة"
                    className="w-24 h-24 mx-auto rounded-full object-cover glow-pulse"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto card-gradient-orange rounded-full flex items-center justify-center glow-pulse">
                    <span className="text-4xl">🏥</span>
                  </div>
                )}
              </div>
              
              {/* Company Name */}
              <h1 className="text-4xl font-bold text-gradient mb-3">
                {systemSettings?.company_name || 'نظام إدارة المناديب'}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>منصة إدارة المناديب الطبية المتقدمة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 form-modern">
              <div>
                <label>
                  <span className="text-shadow-glow">🧑‍💼 اسم المستخدم</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>

              <div>
                <label>
                  <span className="text-shadow-glow">🔒 كلمة المرور</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>

              {error && (
                <div className="alert-modern alert-error scale-in">
                  <span className="ml-2">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    <span>تسجيل الدخول</span>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="card-gradient-blue p-6 rounded-2xl text-center">
                <h3 className="font-bold mb-3 flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>بيانات التجربة</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">أدمن:</span>
                    <span>admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">مندوب:</span>
                    <span>أنشئ من لوحة الأدمن</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Settings Component for Admin
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    logo_image: '',
    company_name: 'نظام إدارة المناديب',
    primary_color: '#ff6b35',
    secondary_color: '#0ea5e9'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      setError('خطأ في جلب الإعدادات');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({...settings, logo_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="card-modern p-8 page-transition">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gradient">إعدادات النظام</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>تخصيص شكل ومظهر النظام</p>
            </div>
          </div>

          {error && (
            <div className="alert-modern alert-error mb-6 scale-in">
              <span className="ml-2">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert-modern alert-success mb-6 scale-in">
              <span className="ml-2">✅</span>
              {success}
            </div>
          )}

          <div className="space-y-8 form-modern">
            {/* Logo Section */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <span>شعار الشركة</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    رفع شعار جديد
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full p-4 border-2 border-dashed rounded-xl hover:border-orange-500 transition-colors"
                    style={{ 
                      background: 'var(--glass-bg)',
                      borderColor: 'var(--brand-orange)',
                      borderOpacity: 0.3
                    }}
                  />
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    يُفضل أن يكون الشعار مربع الشكل وبحجم أقصى 5 ميجابايت
                  </p>
                </div>

                <div className="text-center">
                  <label className="block text-sm font-bold mb-2">
                    معاينة الشعار الحالي
                  </label>
                  {settings.logo_image ? (
                    <img 
                      src={settings.logo_image} 
                      alt="شعار الشركة"
                      className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto card-gradient-orange rounded-full flex items-center justify-center">
                      <span className="text-4xl">🏥</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <span>معلومات الشركة</span>
              </h3>
              
              <div>
                <label className="block text-sm font-bold mb-2">
                  اسم الشركة
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  className="w-full"
                  placeholder="اسم الشركة أو المؤسسة"
                />
              </div>
            </div>

            {/* Color Theme */}
            <div className="card-modern p-6">  
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <span>ألوان النظام</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#ff6b35"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الثانوي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary text-xl py-4 px-8 neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>💾</span>
                    <span>حفظ الإعدادات</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'REMINDER': return '⏰';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600';
      case 'WARNING': return 'text-orange-600';
      case 'ERROR': return 'text-red-600';
      case 'REMINDER': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 rounded-full hover:bg-opacity-10 hover:bg-white transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto card-modern border shadow-lg z-50">
          <div className="p-4 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              الإشعارات ({unreadCount} غير مقروءة)
            </h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-4xl block mb-2">📭</span>
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-opacity-5 hover:bg-white transition-colors ${
                    !notification.is_read ? 'bg-blue-50 bg-opacity-10' : ''
                  }`}
                  style={{ borderColor: 'var(--accent-bg)' }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t" style={{ borderColor: 'var(--accent-bg)' }}>
              <button 
                onClick={() => {
                  // Mark all as read
                  notifications.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Chat System Component
const ChatSystem = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.filter(u => u.id !== user.id)); // Exclude current user
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async () => {
    if (!selectedUserId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/conversations`, {
        participants: [selectedUserId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowNewChat(false);
      setSelectedUserId('');
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (messageType = 'TEXT', messageData = null) => {
    if (!selectedConversation) return;
    
    const messagePayload = {
      message_type: messageType,
      ...(messageType === 'TEXT' ? { message_text: newMessage } : {}),
      ...(messageType === 'VOICE' ? { voice_note: messageData } : {})
    };

    if (messageType === 'TEXT' && !newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/conversations/${selectedConversation.id}/messages`, messagePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (messageType === 'TEXT') {
        setNewMessage('');
      }
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendMessage('VOICE', base64Audio);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">💬</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">نظام المحادثات</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>تواصل مع المناديب والمديرين</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          {/* Conversations List */}
          <div className="card-modern p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">المحادثات</h3>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary text-sm py-2 px-4"
              >
                + محادثة جديدة
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-80">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-orange-100 bg-opacity-20' : 'hover:bg-gray-100 hover:bg-opacity-10'
                  }`}
                >
                  <div className="font-semibold">{conv.participant_names?.join(', ')}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {conv.last_message?.message_text || 'رسالة صوتية'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conv.last_message_at).toLocaleTimeString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 card-modern flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
                  <h3 className="font-bold">{selectedConversation.participant_names?.join(', ')}</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-orange-500 text-white'
                            : 'glass-effect'
                        }`}
                      >
                        {message.message_type === 'TEXT' ? (
                          <p>{message.message_text}</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>🎵</span>
                            <audio controls className="w-32">
                              <source src={message.voice_note} type="audio/wav" />
                            </audio>
                          </div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--accent-bg)' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 form-modern"
                    />
                    <button
                      onClick={() => sendMessage()}
                      className="btn-primary px-4"
                    >
                      📤
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-4 py-2 rounded-lg ${isRecording ? 'bg-red-500 text-white' : 'btn-success'}`}
                    >
                      {isRecording ? '🛑' : '🎤'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-6xl block mb-4">💬</span>
                  <p>اختر محادثة للبدء</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-modern p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">محادثة جديدة</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">اختر مستخدم:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full form-modern"
                >
                  <option value="">اختر مستخدم</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createConversation}
                  className="btn-primary flex-1"
                >
                  بدء المحادثة
                </button>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="btn-warning flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Admin Statistics Dashboard
const AdminStatsDashboard = () => {
  const [stats, setStats] = useState({});
  const [weeklyComparison, setWeeklyComparison] = useState({});
  const [monthlyComparison, setMonthlyComparison] = useState({});
  const [activeManagers, setActiveManagers] = useState([]);
  const [activeSalesReps, setActiveSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all stats in parallel
      const [statsRes, usersRes, visitsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/visits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats(statsRes.data);
      
      // Calculate manager and sales rep statistics
      const users = usersRes.data;
      const visits = visitsRes.data;
      const orders = ordersRes.data || [];
      
      const managers = users.filter(u => u.role === 'manager');
      const salesReps = users.filter(u => u.role === 'sales_rep');
      
      // Enhanced manager stats
      const managerStats = managers.map(manager => {
        const managedReps = salesReps.filter(rep => rep.manager_id === manager.id);
        const managerOrders = orders.filter(order => 
          order.approved_by === manager.id || 
          managedReps.some(rep => rep.id === order.sales_rep_id)
        );
        const approvedOrders = managerOrders.filter(order => order.status === 'APPROVED');
        const teamVisits = visits.filter(visit => 
          managedReps.some(rep => rep.id === visit.sales_rep_id)
        );

        return {
          ...manager,
          team_size: managedReps.length,
          total_orders_managed: managerOrders.length,
          approved_orders: approvedOrders.length,
          approval_rate: managerOrders.length > 0 ? (approvedOrders.length / managerOrders.length * 100).toFixed(1) : 0,
          team_visits: teamVisits.length,
          is_active: teamVisits.some(visit => {
            const visitDate = new Date(visit.created_at);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return visitDate > oneWeekAgo;
          })
        };
      });

      // Enhanced sales rep stats
      const salesRepStats = salesReps.map(rep => {
        const repVisits = visits.filter(visit => visit.sales_rep_id === rep.id);
        const repOrders = orders.filter(order => order.sales_rep_id === rep.id);
        const thisWeekVisits = repVisits.filter(visit => {
          const visitDate = new Date(visit.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return visitDate > oneWeekAgo;
        });

        return {
          ...rep,
          total_visits: repVisits.length,
          total_orders: repOrders.length,
          this_week_visits: thisWeekVisits.length,
          is_active: thisWeekVisits.length > 0,
          last_visit: repVisits.length > 0 ? repVisits[repVisits.length - 1].created_at : null
        };
      });

      setActiveManagers(managerStats);
      setActiveSalesReps(salesRepStats);
      
    } catch (error) {
      console.error('Error fetching enhanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 loading-shimmer rounded-full ml-4"></div>
          <div>
            <div className="w-48 h-8 loading-shimmer rounded mb-2"></div>
            <div className="w-64 h-4 loading-shimmer rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="loading-shimmer h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-gradient">إحصائيات النظام الشاملة</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            نظرة شاملة على أداء النظام والفرق
          </p>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats).map(([key, value]) => {
          const statConfig = {
            total_users: { title: 'إجمالي المستخدمين', icon: '👥', color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            total_clinics: { title: 'إجمالي العيادات', icon: '🏥', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-500 to-green-600' },
            total_doctors: { title: 'إجمالي الأطباء', icon: '⚕️', color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
            total_visits: { title: 'إجمالي الزيارات', icon: '📋', color: 'text-indigo-600', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
            total_products: { title: 'إجمالي المنتجات', icon: '📦', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
            total_warehouses: { title: 'إجمالي المخازن', icon: '🏭', color: 'text-pink-600', bg: 'bg-gradient-to-r from-pink-500 to-pink-600' },
            today_visits: { title: 'زيارات اليوم', icon: '📅', color: 'text-emerald-600', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
            pending_reviews: { title: 'مراجعات معلقة', icon: '⏳', color: 'text-orange-600', bg: 'bg-gradient-to-r from-orange-500 to-orange-600' }
          };
          
          const config = statConfig[key] || { title: key, icon: '📊', color: 'text-gray-600', bg: 'bg-gradient-to-r from-gray-500 to-gray-600' };
          
          return (
            <div key={key} className="card-modern p-6 interactive-element hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 ${config.bg} rounded-full flex items-center justify-center ml-4 shadow-lg`}>
                  <span className="text-2xl text-white">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.color}`}>{value}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${config.bg} h-2 rounded-full`} style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Managers Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">👔</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المديرين</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>إحصائيات مفصلة عن أداء فريق الإدارة</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeManagers.map((manager) => (
            <div key={manager.id} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${manager.is_active ? 'bg-green-500' : 'bg-gray-400'}`}>
                    <span className="text-white font-bold">{manager.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{manager.full_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {manager.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{manager.approval_rate}%</span>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>معدل الموافقة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{manager.team_size}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>حجم الفريق</div>
                </div>
                <div className="text-center p-3 bg-green-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{manager.approved_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات موافق عليها</div>
                </div>
                <div className="text-center p-3 bg-purple-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{manager.total_orders_managed}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>إجمالي الطلبات</div>
                </div>
                <div className="text-center p-3 bg-orange-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{manager.team_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات الفريق</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Reps Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المناديب</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>المناديب النشطة والخاملة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => rep.is_active).length}
            </div>
            <div className="text-lg">مناديب نشطة</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => !rep.is_active).length}
            </div>
            <div className="text-lg">مناديب خاملة</div>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activeSalesReps.map((rep) => (
            <div key={rep.id} className="flex items-center justify-between p-4 glass-effect rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${rep.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                  {rep.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{rep.full_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {rep.last_visit ? `آخر زيارة: ${new Date(rep.last_visit).toLocaleDateString('ar-EG')}` : 'لا توجد زيارات'}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{rep.total_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{rep.total_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{rep.this_week_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>هذا الأسبوع</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <span style={{ color: 'var(--text-primary)' }}>إجراءات سريعة</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn-primary p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">تقرير شامل</div>
          </button>
          <button className="btn-success p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm">إضافة مستخدم</div>
          </button>
          <button className="btn-info p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📢</div>
            <div className="text-sm">إرسال إشعار</div>
          </button>
          <button className="btn-warning p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm">إعدادات النظام</div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Visits Log Component
const EnhancedVisitsLog = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    effectiveness: 'all',
    date_from: '',
    date_to: '',
    sales_rep: 'all',
    clinic: 'all'
  });
  const [stats, setStats] = useState({});
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📋 Comprehensive Visits Log",
      subtitle: "Complete log of all visits by sales reps and managers",
      search: "Search visits...",
      filterByStatus: "Filter by Status",
      filterByEffectiveness: "Filter by Effectiveness", 
      filterBySalesRep: "Filter by Sales Rep",
      filterByClinic: "Filter by Clinic",
      fromDate: "From Date",
      toDate: "To Date",
      allStatuses: "All Statuses",
      allEffectiveness: "All Effectiveness",
      allSalesReps: "All Sales Reps", 
      allClinics: "All Clinics",
      completed: "Completed",
      pending: "Pending Review",
      missed: "Missed",
      effective: "Effective",
      ineffective: "Ineffective",
      notEvaluated: "Not Evaluated",
      visitTime: "Visit Time",
      visitGoals: "Visit Goals",
      clinic: "Clinic",
      location: "Location",
      status: "Status",
      details: "Details",
      totalVisits: "Total Visits",
      effectiveVisits: "Effective Visits",
      withVoiceNotes: "With Voice Notes",
      withOrders: "With Orders"
    },
    ar: {
      title: "📋 سجل الزيارات الشامل",
      subtitle: "سجل كامل لجميع الزيارات التي تمت عن طريق المناديب والمديرين",
      search: "بحث في الزيارات...",
      filterByStatus: "فلترة بالحالة",
      filterByEffectiveness: "فلترة بالفعالية",
      filterBySalesRep: "فلترة بالمندوب", 
      filterByClinic: "فلترة بالعيادة",
      fromDate: "من تاريخ",
      toDate: "إلى تاريخ",
      allStatuses: "جميع الحالات",
      allEffectiveness: "جميع مستويات الفعالية",
      allSalesReps: "جميع المناديب",
      allClinics: "جميع العيادات",
      completed: "تمت",
      pending: "في انتظار المراجعة",
      missed: "تخلف عن الزيارة",
      effective: "فعالة",
      ineffective: "غير فعالة", 
      notEvaluated: "لم يتم التقييم",
      visitTime: "وقت الزيارة",
      visitGoals: "أهداف الزيارة",
      clinic: "العيادة",
      location: "المكان",
      status: "الحالة",
      details: "التفاصيل",
      totalVisits: "إجمالي الزيارات",
      effectiveVisits: "زيارات فعالة",
      withVoiceNotes: "بملاحظات صوتية",
      withOrders: "بطلبات"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visits, filters]);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits/comprehensive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data.visits || []);
      setStats(response.data.stats || {});
    } catch (error) {
      // Mock comprehensive data
      const mockVisits = [
        {
          id: 1,
          visit_date: '2024-01-24T10:30:00Z',
          clinic_name: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
          doctor_name: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
          sales_rep_name: language === 'ar' ? 'محمود علي' : 'Mahmoud Ali',
          visit_goals: language === 'ar' ? 'تقديم منتجات جديدة، متابعة العملاء' : 'Present new products, follow up clients',
          location: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
          status: 'completed',
          effectiveness: true,
          has_voice_notes: true,
          has_orders: true,
          notes: language === 'ar' ? 'زيارة ناجحة مع طلب منتجات جديدة' : 'Successful visit with new product orders',
          duration_minutes: 45,
          created_at: '2024-01-24T10:30:00Z'
        },
        {
          id: 2,
          visit_date: '2024-01-24T14:15:00Z',
          clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
          doctor_name: language === 'ar' ? 'د. فاطمة علي' : 'Dr. Fatema Ali',
          sales_rep_name: language === 'ar' ? 'أحمد حسن' : 'Ahmed Hassan',
          visit_goals: language === 'ar' ? 'متابعة طلبية سابقة، تقديم عروض' : 'Follow up previous order, present offers',
          location: language === 'ar' ? 'شارع المحطة، المنصورة' : 'Station Street, Mansoura',
          status: 'pending',
          effectiveness: null,
          has_voice_notes: false,
          has_orders: false,
          notes: language === 'ar' ? 'تحتاج متابعة إضافية' : 'Needs additional follow-up',
          duration_minutes: 30,
          created_at: '2024-01-24T14:15:00Z'
        },
        {
          id: 3,
          visit_date: '2024-01-23T09:00:00Z',
          clinic_name: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
          doctor_name: language === 'ar' ? 'د. محمد إبراهيم' : 'Dr. Mohamed Ibrahim',
          sales_rep_name: language === 'ar' ? 'فاطمة محمد' : 'Fatema Mohamed',
          visit_goals: language === 'ar' ? 'زيارة تعريفية أولى' : 'Initial introduction visit',
          location: language === 'ar' ? 'شارع سعد زغلول، المنصورة' : 'Saad Zaghloul Street, Mansoura',
          status: 'missed',
          effectiveness: false,
          has_voice_notes: true,
          has_orders: false,
          notes: language === 'ar' ? 'لم يتواجد الطبيب في العيادة' : 'Doctor was not available at clinic',
          duration_minutes: 0,
          created_at: '2024-01-23T09:00:00Z'
        }
      ];

      setVisits(mockVisits);
      setStats({
        total_visits: mockVisits.length,
        effective_visits: mockVisits.filter(v => v.effectiveness === true).length,
        with_voice_notes: mockVisits.filter(v => v.has_voice_notes).length,
        with_orders: mockVisits.filter(v => v.has_orders).length
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = visits.filter(visit => {
      const matchesSearch = 
        visit.clinic_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        visit.doctor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        visit.sales_rep_name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || visit.status === filters.status;
      
      const matchesEffectiveness = 
        filters.effectiveness === 'all' ||
        (filters.effectiveness === 'effective' && visit.effectiveness === true) ||
        (filters.effectiveness === 'ineffective' && visit.effectiveness === false) ||
        (filters.effectiveness === 'not_evaluated' && visit.effectiveness === null);
      
      const matchesSalesRep = filters.sales_rep === 'all' || visit.sales_rep_name === filters.sales_rep;
      const matchesClinic = filters.clinic === 'all' || visit.clinic_name === filters.clinic;
      
      const matchesDateFrom = !filters.date_from || new Date(visit.visit_date) >= new Date(filters.date_from);
      const matchesDateTo = !filters.date_to || new Date(visit.visit_date) <= new Date(filters.date_to);

      return matchesSearch && matchesStatus && matchesEffectiveness && 
             matchesSalesRep && matchesClinic && matchesDateFrom && matchesDateTo;
    });
    
    setFilteredVisits(filtered);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: t.completed, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending':
        return { text: t.pending, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'missed':
        return { text: t.missed, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getEffectivenessInfo = (effectiveness) => {
    if (effectiveness === true) return { text: t.effective, color: 'text-green-600', bg: 'bg-green-100' };
    if (effectiveness === false) return { text: t.ineffective, color: 'text-red-600', bg: 'bg-red-100' };
    return { text: t.notEvaluated, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const openVisitDetails = (visit) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  // Get unique values for filters
  const uniqueSalesReps = [...new Set(visits.map(v => v.sales_rep_name))];
  const uniqueClinics = [...new Set(visits.map(v => v.clinic_name))];

  return (
    <>
      <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-16 h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gradient">{t.title}</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_visits || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.totalVisits}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.effective_visits || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.effectiveVisits}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.with_voice_notes || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.withVoiceNotes}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.with_orders || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.withOrders}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card-modern p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">{t.search}:</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder={t.search}
                  className="form-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterByStatus}:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allStatuses}</option>
                  <option value="completed">{t.completed}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="missed">{t.missed}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterByEffectiveness}:</label>
                <select
                  value={filters.effectiveness}
                  onChange={(e) => setFilters({...filters, effectiveness: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allEffectiveness}</option>
                  <option value="effective">{t.effective}</option>
                  <option value="ineffective">{t.ineffective}</option>
                  <option value="not_evaluated">{t.notEvaluated}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterBySalesRep}:</label>
                <select
                  value={filters.sales_rep}
                  onChange={(e) => setFilters({...filters, sales_rep: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allSalesReps}</option>
                  {uniqueSalesReps.map((rep) => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.fromDate}:</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                  className="form-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.toDate}:</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                  className="form-modern w-full"
                />
              </div>
            </div>
          </div>

          {/* Visits Table */}
          <div className="card-modern overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span>📊</span>
                <span>{t.title} ({filteredVisits.length})</span>
              </h3>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </p>
              </div>
            ) : (
              <div className="table-modern">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.visitTime}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.clinic}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'المندوب' : 'Sales Rep'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.visitGoals}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.location}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'الفعالية' : 'Effectiveness'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.map((visit) => {
                      const status = getStatusInfo(visit.status);
                      const effectiveness = getEffectivenessInfo(visit.effectiveness);
                      
                      return (
                        <tr key={visit.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">
                                {new Date(visit.visit_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(visit.visit_date).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {visit.duration_minutes > 0 && (
                                <div className="text-xs text-blue-600">
                                  {visit.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.clinic_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.doctor_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.sales_rep_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm max-w-xs truncate" title={visit.visit_goals}>
                              {visit.visit_goals}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm max-w-xs truncate" title={visit.location}>
                              📍 {visit.location}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${effectiveness.bg} ${effectiveness.color}`}>
                              {effectiveness.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openVisitDetails(visit)}
                                className="btn-info text-xs px-3 py-1"
                                title={t.details}
                              >
                                👁️ {t.details}
                              </button>
                              {visit.has_voice_notes && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                  🎤
                                </span>
                              )}
                              {visit.has_orders && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                  📦
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visit Details Modal */}
      {showVisitDetails && selectedVisit && (
        <VisitDetailsModal
          visit={selectedVisit}
          language={language}
          onClose={() => setShowVisitDetails(false)}
        />
      )}
    </>
  );
};

// Visit Details Modal Component
const VisitDetailsModal = ({ visit, language, onClose }) => {
  const t = language === 'ar' ? {
    visitDetails: 'تفاصيل الزيارة',
    basicInfo: 'المعلومات الأساسية',
    visitTime: 'وقت الزيارة',
    duration: 'مدة الزيارة',
    clinic: 'العيادة',
    doctor: 'الطبيب',
    salesRep: 'المندوب',
    location: 'الموقع',
    goals: 'أهداف الزيارة',
    status: 'حالة الزيارة',
    effectiveness: 'فعالية الزيارة',
    notes: 'الملاحظات',
    voiceNotes: 'ملاحظات صوتية',
    orders: 'الطلبات',
    close: 'إغلاق',
    minutes: 'دقيقة',
    available: 'متاح',
    notAvailable: 'غير متاح'
  } : {
    visitDetails: 'Visit Details',
    basicInfo: 'Basic Information',
    visitTime: 'Visit Time',
    duration: 'Duration',
    clinic: 'Clinic',
    doctor: 'Doctor',
    salesRep: 'Sales Rep',
    location: 'Location',
    goals: 'Visit Goals',
    status: 'Visit Status',
    effectiveness: 'Effectiveness',
    notes: 'Notes',
    voiceNotes: 'Voice Notes',
    orders: 'Orders',
    close: 'Close',
    minutes: 'minutes',
    available: 'Available',
    notAvailable: 'Not Available'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">{t.visitDetails}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>ℹ️</span>
              <span>{t.basicInfo}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-500">{t.visitTime}</label>
                <p className="text-lg font-medium">
                  {new Date(visit.visit_date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.duration}</label>
                <p className="text-lg font-medium">
                  {visit.duration_minutes} {t.minutes}
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.clinic}</label>
                <p className="text-lg font-medium">{visit.clinic_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.doctor}</label>
                <p className="text-lg font-medium">{visit.doctor_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.salesRep}</label>
                <p className="text-lg font-medium">{visit.sales_rep_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.location}</label>
                <p className="text-lg font-medium">📍 {visit.location}</p>
              </div>
            </div>
          </div>

          {/* Visit Goals and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🎯</span>
                <span>{t.goals}</span>
              </h4>
              <p className="text-gray-700">{visit.visit_goals}</p>
            </div>
            
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>{t.status} & {t.effectiveness}</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-500">{t.status}</label>
                  <p className={`text-lg font-medium ${
                    visit.status === 'completed' ? 'text-green-600' :
                    visit.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {visit.status === 'completed' ? (language === 'ar' ? 'تمت' : 'Completed') :
                     visit.status === 'pending' ? (language === 'ar' ? 'في انتظار المراجعة' : 'Pending Review') :
                     (language === 'ar' ? 'تخلف عن الزيارة' : 'Missed')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">{t.effectiveness}</label>
                  <p className={`text-lg font-medium ${
                    visit.effectiveness === true ? 'text-green-600' :
                    visit.effectiveness === false ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {visit.effectiveness === true ? (language === 'ar' ? '✅ فعالة' : '✅ Effective') :
                     visit.effectiveness === false ? (language === 'ar' ? '❌ غير فعالة' : '❌ Ineffective') :
                     (language === 'ar' ? '⏳ لم يتم التقييم' : '⏳ Not Evaluated')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Media */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📝</span>
              <span>{t.notes}</span>
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {visit.notes || (language === 'ar' ? 'لا توجد ملاحظات' : 'No notes available')}
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span>🎤</span>
                  <span className="text-sm font-medium">{t.voiceNotes}:</span>
                  <span className={`text-sm ${visit.has_voice_notes ? 'text-green-600' : 'text-gray-500'}`}>
                    {visit.has_voice_notes ? t.available : t.notAvailable}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span className="text-sm font-medium">{t.orders}:</span>
                  <span className={`text-sm ${visit.has_orders ? 'text-green-600' : 'text-gray-500'}`}>
                    {visit.has_orders ? t.available : t.notAvailable}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Statistics Dashboard Component
const EnhancedStatisticsDashboard = ({ stats, user }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [comparison, setComparison] = useState({});
  const [quickActions, setQuickActions] = useState([]);
  const [filteredStats, setFilteredStats] = useState(stats);
  const [loading, setLoading] = useState(false);
  const { analytics, loading: analyticsLoading } = useRealTimeAnalytics();
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📊 Comprehensive Statistics Dashboard",
      subtitle: "Complete overview of system and team performance",
      today: "Today",
      week: "Week", 
      month: "Month",
      quarter: "Quarter",
      live: "Live",
      quickActions: "⚡ Quick Actions",
      liveStats: "🔴 Live Statistics",
      updatesEvery30: "(Updates every 30 seconds)",
      visitsToday: "Visits Today",
      activeSalesReps: "Active Sales Reps",
      pendingOrders: "Pending Orders",
      totalUsers: "Total Users",
      totalClinics: "Total Clinics",
      totalVisits: "Total Visits",
      totalWarehouses: "Total Warehouses",
      lowStockItems: "Low Stock Items",
      todayVisits: "Today's Visits",
      lastUpdated: "Last updated:"
    },
    ar: {
      title: "📊 لوحة الإحصائيات الشاملة",
      subtitle: "نظرة شاملة على أداء النظام والفريق",
      today: "اليوم",
      week: "الأسبوع",
      month: "الشهر", 
      quarter: "الربع",
      live: "مباشر",
      quickActions: "⚡ إجراءات سريعة",
      liveStats: "🔴 الإحصائيات المباشرة",
      updatesEvery30: "(يتم التحديث كل 30 ثانية)",
      visitsToday: "زيارات اليوم",
      activeSalesReps: "مناديب نشطين الآن",
      pendingOrders: "طلبيات معلقة",
      totalUsers: "إجمالي المستخدمين",
      totalClinics: "إجمالي العيادات", 
      totalVisits: "إجمالي الزيارات",
      totalWarehouses: "إجمالي المخازن",
      lowStockItems: "منتجات نقص مخزون",
      todayVisits: "زيارات اليوم",
      lastUpdated: "آخر تحديث:"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchComparisonData();
    fetchQuickActions();
    applyTimeFilter();
  }, [timeRange]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Simulate filtered data based on timeRange
      let filtered = { ...stats };
      
      switch (timeRange) {
        case 'today':
          // Fetch today's data
          const token = localStorage.getItem('token');
          const todayResponse = await axios.get(`${API}/dashboard/stats?period=today`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = todayResponse.data;
          break;
        case 'week':
          // This week's data - default
          break;
        case 'month':
          // This month's data
          const monthResponse = await axios.get(`${API}/dashboard/stats?period=month`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = monthResponse.data;
          break;
        case 'quarter':
          // This quarter's data
          const quarterResponse = await axios.get(`${API}/dashboard/stats?period=quarter`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = quarterResponse.data;
          break;
      }
      
      setFilteredStats(filtered);
      setComparison({
        users_growth: '+12%',
        visits_growth: '+8%',
        clinics_growth: '+15%',
        revenue_growth: '+22%'
      });
    } catch (error) {
      console.error('Error fetching time-filtered data:', error);
      setFilteredStats(stats);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = async () => {
    await fetchComparisonData();
  };

  const fetchQuickActions = async () => {
    const actions = [];
    if (filteredStats.pending_reviews > 0) {
      actions.push({ type: 'reviews', count: filteredStats.pending_reviews, text: language === 'ar' ? 'مراجعات تحتاج موافقة' : 'Reviews Need Approval' });
    }
    if (filteredStats.low_stock_items > 0) {
      actions.push({ type: 'stock', count: filteredStats.low_stock_items, text: language === 'ar' ? 'منتجات نقص مخزون' : 'Low Stock Items' });
    }
    if (filteredStats.pending_clinics > 0) {
      actions.push({ type: 'clinics', count: filteredStats.pending_clinics, text: language === 'ar' ? 'عيادات تحتاج موافقة' : 'Clinics Need Approval' });
    }
    setQuickActions(actions);
  };

  // Updated stats config - removed doctors and products as requested
  const statsConfig = [
    { key: 'total_users', title: t.totalUsers, icon: '👥', color: 'bg-blue-500', growth: comparison.users_growth },
    { key: 'total_clinics', title: t.totalClinics, icon: '🏥', color: 'bg-green-500', growth: comparison.clinics_growth },
    { key: 'total_visits', title: t.totalVisits, icon: '📋', color: 'bg-indigo-500', growth: comparison.visits_growth },
    { key: 'total_warehouses', title: t.totalWarehouses, icon: '🏪', color: 'bg-pink-500', growth: '+0%' },
    { key: 'today_visits', title: t.todayVisits, icon: '📅', color: 'bg-teal-500', growth: '+18%' },
    { key: 'low_stock_items', title: t.lowStockItems, icon: '⚠️', color: 'bg-red-500', isAlert: true }
  ];

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="space-y-8">
        {/* Header with Time Range Selector and Real-time Indicator */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gradient">{t.title}</h2>
              {analytics && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{t.live}</span>
                </div>
              )}
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {t.subtitle} - {t.lastUpdated} {analytics?.timestamp ? new Date(analytics.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US') : language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {['today', 'week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range ? 'btn-primary' : 'btn-secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && timeRange === range ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t[range]
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Live Stats */}
        {analytics && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔴</span>
              <span>{t.liveStats}</span>
              <span className="text-sm text-green-600 animate-pulse">{t.updatesEvery30}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect p-4 rounded-lg border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{analytics.live_stats.visits_today}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.visitsToday}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{analytics.live_stats.active_sales_reps}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.activeSalesReps}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{analytics.live_stats.pending_orders}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.pendingOrders}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>{t.quickActions}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action.text}</p>
                      <p className="text-2xl font-bold text-orange-500">{action.count}</p>
                    </div>
                    <button className="btn-warning text-sm">
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((config) => {
            const value = stats[config.key] || 0;
            return (
              <div key={config.key} className="card-modern p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-10 -mt-10" 
                     style={{ background: config.color.replace('bg-', '') }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {config.icon}
                    </div>
                    {config.growth && (
                      <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
                        config.isAlert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {config.growth}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.isAlert ? 'text-red-500' : ''}`} 
                     style={{ color: config.isAlert ? undefined : 'var(--text-primary)' }}>
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Performance Chart */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>{language === 'ar' ? 'أداء الزيارات' : 'Visits Performance'}</span>
            </h3>
            {analytics?.chart_data ? (
              <div className="h-64">
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-600 mb-2">{language === 'ar' ? 'رسم بياني تفاعلي للأداء' : 'Interactive Performance Chart'}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {analytics.chart_data.slice(-4).map((point, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow">
                          <div className="text-sm text-gray-500">{new Date(point.date).toLocaleDateString()}</div>
                          <div className="text-lg font-bold text-blue-600">{point.visits} {language === 'ar' ? 'زيارة' : 'visits'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center glass-effect rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p style={{ color: 'var(--text-secondary)' }}>{language === 'ar' ? 'رسم بياني لأداء الزيارات' : 'Visits Performance Chart'}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    {language === 'ar' ? 'يتم تحميل البيانات...' : 'Loading data...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Recent Activity */}
          <EnhancedRecentActivity language={language} />
        </div>

        {user.role === 'admin' && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👑</span>
              <span>{language === 'ar' ? 'إجراءات المدير' : 'Admin Actions'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminActionButton 
                icon="📊" 
                text={language === 'ar' ? 'تصدير التقارير' : 'Export Reports'} 
                onClick={() => handleExportReports()} 
              />
              <AdminActionButton 
                icon="👥" 
                text={language === 'ar' ? 'إدارة المستخدمين' : 'User Management'} 
                onClick={() => handleUserManagement()} 
              />
              <AdminActionButton 
                icon="⚙️" 
                text={language === 'ar' ? 'إعدادات النظام' : 'System Settings'} 
                onClick={() => handleSystemSettings()} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Recent Activity Component
const EnhancedRecentActivity = ({ language }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/activities/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
    } catch (error) {
      // Fallback to mock data if API not available
      setActivities([
        {
          id: 1,
          type: 'visit',
          message: language === 'ar' ? 'زيارة جديدة للدكتور أحمد من المندوب محمود' : 'New visit to Dr. Ahmed by sales rep Mahmoud',
          details: {
            doctor: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
            sales_rep: language === 'ar' ? 'محمود علي' : 'Mahmoud Ali',
            clinic: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
            visit_time: '10:30 AM',
            effectiveness: true
          },
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          color: 'text-green-500'
        },
        {
          id: 2,
          type: 'clinic',
          message: language === 'ar' ? 'تم إضافة عيادة جديدة من المندوب إبراهيم' : 'New clinic added by sales rep Ibrahim',
          details: {
            clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
            sales_rep: language === 'ar' ? 'إبراهيم حسن' : 'Ibrahim Hassan',
            address: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
            status: 'pending_approval'
          },
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          color: 'text-blue-500'
        },
        {
          id: 3,
          type: 'order',
          message: language === 'ar' ? 'طلبية جديدة من المندوب إبراهيم تحتاج للموافقة' : 'New order from sales rep Ibrahim needs approval',
          details: {
            order_id: 'ORD-2024-001',
            sales_rep: language === 'ar' ? 'إبراهيم حسن' : 'Ibrahim Hassan',
            clinic: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
            total_amount: 2500,
            currency: 'EGP',
            items_count: 5,
            status: 'pending_manager_approval'
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          color: 'text-orange-500'
        },
        {
          id: 4,
          type: 'user',
          message: language === 'ar' ? 'تم إضافة مستخدم جديد من المدير علي' : 'New user added by manager Ali',
          details: {
            user_name: language === 'ar' ? 'خالد محمد' : 'Khaled Mohamed',
            role: 'sales_rep',
            manager: language === 'ar' ? 'علي أحمد' : 'Ali Ahmed',
            department: language === 'ar' ? 'المبيعات - المنطقة الشرقية' : 'Sales - Eastern Region',
            employee_id: 'EMP-2024-012'
          },
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          color: 'text-purple-500'
        }
      ]);
      console.error('Using mock data for activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity) => {
    // Show detailed modal for activity
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const getActivityIcon = (type) => {
    const icons = {
      visit: '👨‍⚕️',
      clinic: '🏥',
      order: '📦',
      user: '👤',
      approval: '✅',
      warehouse: '🏪'
    };
    return icons[type] || '📋';
  };

  return (
    <>
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🕐</span>
          <span>{language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activities'}</span>
        </h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 glass-effect rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  activity.type === 'visit' ? 'bg-green-500' :
                  activity.type === 'clinic' ? 'bg-blue-500' :
                  activity.type === 'order' ? 'bg-orange-500' : 'bg-purple-500'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {activity.message}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(activity.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {showActivityModal && selectedActivity && (
        <ActivityDetailsModal 
          activity={selectedActivity}
          language={language}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </>
  );
};

// Activity Details Modal Component
const ActivityDetailsModal = ({ activity, language, onClose }) => {
  const translations = {
    en: {
      activityDetails: 'Activity Details',
      visitDetails: 'Visit Details',
      clinicDetails: 'Clinic Details', 
      orderDetails: 'Order Details',
      userDetails: 'User Details',
      close: 'Close'
    },
    ar: {
      activityDetails: 'تفاصيل النشاط',
      visitDetails: 'تفاصيل الزيارة',
      clinicDetails: 'تفاصيل العيادة',
      orderDetails: 'تفاصيل الطلبية',
      userDetails: 'تفاصيل المستخدم',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">{t.activityDetails}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Activity Header */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${
              activity.type === 'visit' ? 'bg-green-500' :
              activity.type === 'clinic' ? 'bg-blue-500' :
              activity.type === 'order' ? 'bg-orange-500' : 'bg-purple-500'
            }`}>
              {activity.type === 'visit' ? '👨‍⚕️' :
               activity.type === 'clinic' ? '🏥' :
               activity.type === 'order' ? '📦' : '👤'}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">{activity.message}</h4>
              <p className="text-sm text-gray-600">
                {new Date(activity.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(activity.details || {}).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-bold text-gray-600 capitalize mb-1">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-lg text-gray-800">
                  {typeof value === 'boolean' ? (value ? '✅' : '❌') : 
                   typeof value === 'number' ? value.toLocaleString() : 
                   value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Action Button Component
const AdminActionButton = ({ icon, text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn-primary flex items-center justify-center gap-2 py-3 hover:scale-105 transition-transform"
    >
      <span className="text-xl">{icon}</span>
      <span>{text}</span>
    </button>
  );
};

// Selfie Capture Component for Sales Reps
const SelfieCapture = ({ onCapture, onSkip }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📷 Daily Check-in Selfie",
      subtitle: "Please take a selfie to verify your attendance",
      startCamera: "🎥 Start Camera",
      takeSelfie: "📸 Take Selfie",
      retake: "🔄 Retake",
      confirm: "✅ Confirm",
      skip: "⏭️ Skip for Now",
      cameraError: "Cannot access camera. Please allow camera permissions."
    },
    ar: {
      title: "📷 سيلفي تسجيل الحضور اليومي",
      subtitle: "يرجى أخذ سيلفي للتأكد من حضورك",
      startCamera: "🎥 تشغيل الكاميرا",
      takeSelfie: "📸 التقاط سيلفي",
      retake: "🔄 إعادة التقاط",
      confirm: "✅ تأكيد",
      skip: "⏭️ تخطي الآن",
      cameraError: "لا يمكن الوصول للكاميرا. يرجى السماح بصلاحيات الكاميرا."
    }
  };

  const t = translations[language] || translations.en;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(t.cameraError);
    }
  };

  const takeSelfie = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturing(true);
      
      // Save selfie to backend
      saveSelfie(imageData);
    }
  };

  const saveSelfie = async (imageData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/selfie`, {
        selfie_image: imageData,
        timestamp: new Date().toISOString(),
        location: await getCurrentLocation()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onCapture) onCapture(imageData);
    } catch (error) {
      console.error('Error saving selfie:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve({ latitude: null, longitude: null })
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="modal-modern p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gradient mb-2">{t.title}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg"></div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <button
                    onClick={startCamera}
                    className="btn-primary"
                  >
                    {t.startCamera}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {stream && (
            <div className="flex gap-3">
              <button
                onClick={takeSelfie}
                className="btn-success flex-1 flex items-center justify-center gap-2"
              >
                <span>📸</span>
                <span>{t.takeSelfie}</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                stopCamera();
                if (onSkip) onSkip();
              }}
              className="btn-secondary flex-1"
            >
              {t.skip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Daily Plan Component for Sales Reps
const DailyPlan = ({ user, onClose }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📋 Today's Plan",
      subtitle: "Your daily tasks and schedule",
      visits: "Visits Scheduled",
      orders: "Orders to Process", 
      clinics: "Clinics to Visit",
      startDay: "🚀 Start Your Day",
      viewMap: "🗺️ View on Map",
      noTasks: "No tasks scheduled for today",
      loading: "Loading your daily plan..."
    },
    ar: {
      title: "📋 خطة اليوم",
      subtitle: "مهامك وجدولك اليومي",
      visits: "زيارات مجدولة",
      orders: "طلبات للمعالجة",
      clinics: "عيادات للزيارة", 
      startDay: "🚀 ابدأ يومك",
      viewMap: "🗺️ عرض على الخريطة",
      noTasks: "لا توجد مهام مجدولة لليوم",
      loading: "جاري تحميل خطة اليوم..."
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchDailyPlan();
  }, []);

  const fetchDailyPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}/daily-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlan(response.data);
    } catch (error) {
      // Mock data for demonstration
      setPlan({
        visits: [
          {
            id: 1,
            clinic_name: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
            doctor_name: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
            time: '10:00 AM',
            address: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
            status: 'pending'
          },
          {
            id: 2,
            clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
            doctor_name: language === 'ar' ? 'د. فاطمة علي' : 'Dr. Fatema Ali',
            time: '2:00 PM',
            address: language === 'ar' ? 'شارع المحطة، المنصورة' : 'Station Street, Mansoura',
            status: 'pending'
          }
        ],
        orders: [
          {
            id: 1,
            clinic_name: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
            items_count: 5,
            total_amount: 2500,
            status: 'pending_delivery'
          }
        ],
        route_optimized: true,
        estimated_duration: '6 hours',
        total_distance: '45 km'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="modal-modern p-8 w-full max-w-2xl">
          <div className="text-center">
            <div className="w-16 h-16 loading-shimmer rounded-full mx-auto mb-4"></div>
            <p>{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gradient">{t.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{plan?.visits?.length || 0}</div>
              <div className="text-sm text-gray-600">{t.visits}</div>
            </div>
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{plan?.orders?.length || 0}</div>
              <div className="text-sm text-gray-600">{t.orders}</div>
            </div>
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{plan?.estimated_duration || 'N/A'}</div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'مدة متوقعة' : 'Estimated Duration'}</div>
            </div>
          </div>

          {/* Visits Schedule */}
          {plan?.visits && plan.visits.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>👨‍⚕️</span>
                <span>{t.visits}</span>
              </h4>
              <div className="space-y-3">
                {plan.visits.map((visit, index) => (
                  <div key={visit.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{visit.clinic_name}</div>
                      <div className="text-sm text-gray-600">{visit.doctor_name}</div>
                      <div className="text-xs text-gray-500">{visit.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{visit.time}</div>
                      <div className="text-xs text-gray-500">{language === 'ar' ? 'معلق' : 'Pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders to Process */}
          {plan?.orders && plan.orders.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📦</span>
                <span>{t.orders}</span>
              </h4>
              <div className="space-y-3">
                {plan.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{order.clinic_name}</div>
                      <div className="text-sm text-gray-600">
                        {order.items_count} {language === 'ar' ? 'عناصر' : 'items'} • {order.total_amount.toLocaleString()} EGP
                      </div>
                    </div>
                    <div className="text-sm text-orange-600 font-medium">
                      {language === 'ar' ? 'في انتظار التسليم' : 'Pending Delivery'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan?.visits?.length === 0 && plan?.orders?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg text-gray-600">{t.noTasks}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>{t.startDay}</span>
            </button>
            <button
              className="btn-info flex items-center justify-center gap-2 px-6"
            >
              <span>🗺️</span>
              <span>{t.viewMap}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const handleExportReports = () => {
  // Export functionality
  const reportData = {
    generated_at: new Date().toISOString(),
    type: 'comprehensive',
    format: 'pdf'
  };
  
  // Create downloadable link
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `report_${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const handleUserManagement = () => {
  // Navigate to user management (will be handled by proper navigation)
  const event = new CustomEvent('navigateToTab', { detail: 'users' });
  window.dispatchEvent(event);
};

const handleSystemSettings = () => {
  // Navigate to system settings
  const event = new CustomEvent('navigateToTab', { detail: 'settings' });
  window.dispatchEvent(event);
};

// Enhanced User Management Component
// Enhanced User Management Component
const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: '',
    phone: '',
    manager_id: '',
    department: '',
    employee_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bulkAction, setBulkAction] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      setError('خطأ في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إنشاء المستخدم بنجاح');
      setShowCreateUser(false);
      setNewUser({
        username: '', email: '', password: '', full_name: '', role: '', 
        phone: '', manager_id: '', department: '', employee_id: ''
      });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في إنشاء المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const updateData = { ...selectedUser };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      
      await axios.patch(`${API}/users/${selectedUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم تحديث المستخدم بنجاح');
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تحديث المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم حذف المستخدم بنجاح');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في حذف المستخدم');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const action = currentStatus ? 'تعطيل' : 'تنشيط';
      setSuccess(`تم ${action} المستخدم بنجاح`);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تغيير حالة المستخدم');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    const confirmed = window.confirm(`هل أنت متأكد من تطبيق "${bulkAction}" على ${selectedUsers.size} مستخدم؟`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedUsers).map(userId => {
        if (bulkAction === 'activate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (bulkAction === 'deactivate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });

      await Promise.all(promises);
      setSuccess(`تم تطبيق الإجراء على ${selectedUsers.size} مستخدم`);
      setSelectedUsers(new Set());
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      setError('خطأ في تطبيق الإجراء الجماعي');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditUser(true);
  };

  const openDetailsModal = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data);
      setShowUserDetails(true);
    } catch (error) {
      setError('خطأ في جلب تفاصيل المستخدم');
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'مدير النظام',
      manager: 'مدير',
      sales_rep: 'مندوب مبيعات',
      warehouse_manager: 'مدير مخزن',
      accounting: 'محاسب'
    };
    return roles[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">إدارة المستخدمين الشاملة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة كاملة للمستخدمين مع جميع الصلاحيات والإحصائيات
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 neon-glow"
          >
            <span>➕</span>
            <span>مستخدم جديد</span>
          </button>
        </div>

        {/* User Statistics */}
        {userStats.total_users && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{userStats.total_users}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي المستخدمين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{userStats.active_distribution?.active || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين نشطين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{userStats.active_distribution?.inactive || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين معطلين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(userStats.role_distribution || {}).length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>أنواع الأدوار</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2">البحث:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو البريد..."
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالدور:</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="manager">مدير</option>
                <option value="sales_rep">مندوب مبيعات</option>
                <option value="warehouse_manager">مدير مخزن</option>
                <option value="accounting">محاسب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالحالة:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إجراء جماعي:</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="form-modern w-full"
              >
                <option value="">اختر إجراء</option>
                <option value="activate">تنشيط المحدد</option>
                <option value="deactivate">تعطيل المحدد</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchUsers}
                className="btn-info flex-1 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>تحديث</span>
              </button>
              {selectedUsers.size > 0 && bulkAction && (
                <button
                  onClick={handleBulkAction}
                  className="btn-warning flex-1 flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>تطبيق</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card-modern overflow-hidden">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>📋</span>
              <span>قائمة المستخدمين ({filteredUsers.length})</span>
              {selectedUsers.size > 0 && (
                <span className="badge-modern badge-info">
                  {selectedUsers.size} محدد
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المستخدم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">آخر دخول</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.profile_image ? (
                              <img 
                                src={user.profile_image} 
                                alt={user.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                user.is_active ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-500'
                              }`}>
                                {user.full_name.charAt(0)}
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {user.full_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {user.username} • {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                📱 {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.role === 'admin' ? 'badge-danger' :
                          user.role === 'manager' ? 'badge-warning' :
                          user.role === 'sales_rep' ? 'badge-info' :
                          user.role === 'warehouse_manager' ? 'badge-success' : 'badge-secondary'
                        }`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {user.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {user.last_login ? 
                            new Date(user.last_login).toLocaleDateString('ar-EG') : 
                            'لم يسجل دخول'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailsModal(user)}
                            className="btn-info text-xs px-3 py-1"
                            title="التفاصيل"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="btn-primary text-xs px-3 py-1"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`text-xs px-3 py-1 rounded ${
                              user.is_active ? 'btn-warning' : 'btn-success'
                            }`}
                            title={user.is_active ? 'تعطيل' : 'تنشيط'}
                          >
                            {user.is_active ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="btn-danger text-xs px-3 py-1"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">➕ إضافة مستخدم جديد</h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="form-modern w-full"
                      required
                    >
                      <option value="">اختر الدور</option>
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الموظف</label>
                    <input
                      type="text"
                      value={newUser.employee_id}
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري الإنشاء...' : '✅ إنشاء المستخدم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">✏️ تعديل المستخدم</h3>
                <button
                  onClick={() => setShowEditUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل</label>
                    <input
                      type="text"
                      value={selectedUser.full_name}
                      onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                      className="form-modern w-full"
                    >
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={selectedUser.department || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري التحديث...' : '✅ حفظ التغييرات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">👁️ تفاصيل المستخدم</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500">الاسم الكامل</label>
                      <p className="text-lg font-medium">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">اسم المستخدم</label>
                      <p className="text-lg font-medium">{selectedUser.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">البريد الإلكتروني</label>
                      <p className="text-lg font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">رقم الهاتف</label>
                      <p className="text-lg font-medium">{selectedUser.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الدور</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.role === 'admin' ? 'badge-danger' :
                          selectedUser.role === 'manager' ? 'badge-warning' :
                          selectedUser.role === 'sales_rep' ? 'badge-info' : 'badge-success'
                        }`}>
                          {getRoleText(selectedUser.role)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الحالة</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {selectedUser.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {selectedUser.statistics && (
                  <div className="card-modern p-6">
                    <h4 className="text-lg font-bold mb-4">الإحصائيات</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.statistics.total_visits !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الزيارات</label>
                          <p className="text-2xl font-bold text-blue-600">{selectedUser.statistics.total_visits}</p>
                        </div>
                      )}
                      {selectedUser.statistics.total_orders !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الطلبات</label>
                          <p className="text-2xl font-bold text-green-600">{selectedUser.statistics.total_orders}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">معلومات النشاط</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-bold text-gray-500">تاريخ الإنشاء</label>
                      <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">آخر دخول</label>
                      <p className="text-lg">
                        {selectedUser.last_login ? 
                          new Date(selectedUser.last_login).toLocaleString('ar-EG') : 
                          'لم يسجل دخول بعد'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="btn-primary px-6 py-3"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components and Sub-systems

// Helper utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Real-time Analytics Hook
const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/analytics/realtime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching real-time analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { analytics, loading };
};

// Enhanced Global Search Button
const GlobalSearchButton = () => {
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      searchPlaceholder: "🔍 Search across the system...",
      searchTitle: "Global Search"
    },
    ar: {
      searchPlaceholder: "🔍 بحث عام في النظام...",
      searchTitle: "البحث الشامل"
    }
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowGlobalSearch(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800 w-full max-w-md"
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          <SVGIcon name="search" size={20} />
          <span className="text-sm">{t.searchPlaceholder}</span>
        </button>
      </div>

      <GlobalSearch 
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </>
  );
};
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                    <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                      <span>{t[category]}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {items.length}
                      </span>
                    </h4>
                  </div>
                  <div className="p-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-150 border border-transparent hover:border-blue-200"
                        onClick={() => {
                          setShowResults(false);
                          setQuery('');
                          // Handle navigation to item details
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(item.full_name || item.name || item.username)?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">
                              {item.full_name || item.name || item.username}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category === 'users' && item.role && `${item.email} • ${item.role}`}
                              {category === 'clinics' && item.address}
                              {category === 'doctors' && item.specialty}
                              {category === 'products' && `${item.price} EGP • ${item.unit}`}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Advanced Reports Component
const AdvancedReports = () => {
  const [reportType, setReportType] = useState('visits_performance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      const response = await axios.get(`${API}/reports/advanced?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const ChartRenderer = ({ data, type, title }) => {
    if (!data || !data.data) return <div>لا توجد بيانات للعرض</div>;

    return (
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">رسم بياني تفاعلي</p>
            <p className="text-sm text-gray-500 mt-2">
              {data.data.length} نقطة بيانات
            </p>
            <div className="mt-4 text-xs text-gray-400">
              {data.data.slice(0, 3).map((point, index) => (
                <div key={index}>
                  {point._id}: {point.total_visits || point.total_orders || 'N/A'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">📈</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">التقارير التفاعلية المتقدمة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                تحليلات وتقارير شاملة مع رسوم بيانية تفاعلية
              </p>
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">نوع التقرير:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-modern w-full"
              >
                <option value="visits_performance">أداء الزيارات</option>
                <option value="sales_by_rep">المبيعات بواسطة المناديب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">من تاريخ:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="loading-shimmer w-4 h-4 rounded-full"></div>
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>تحديث التقرير</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <ChartRenderer 
            data={reportData} 
            type={reportData.type} 
            title={reportData.title}
          />
        )}
      </div>
    </div>
  );
};

// QR Code Scanner Component
const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('لا يمكن الوصول للكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Simulate QR code scanning (in real app, use a QR code library)
      const imageData = canvas.toDataURL();
      onScan({ 
        type: 'clinic', 
        id: 'sample-clinic-id',
        name: 'عيادة تجريبية',
        address: 'عنوان تجريبي' 
      });
    }
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gradient">📱 مسح QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg animate-pulse"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <button
                    onClick={captureAndScan}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <span>📷</span>
                    <span>مسح الكود</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg mb-4">اضغط لبدء المسح</p>
                  <button
                    onClick={startScanning}
                    className="btn-primary"
                  >
                    🎥 تشغيل الكاميرا
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              📋 وجه الكاميرا نحو QR Code للعيادة أو المنتج
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Language Selector with English as Primary
const LanguageSelector = () => {
  const { language, setLanguage } = useContext(ThemeContext);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' }
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    
    // Apply RTL/LTR direction
    const selectedLang = languages.find(l => l.code === lang);
    document.dir = selectedLang?.dir || 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <div className="relative">
      <select 
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
        style={{ direction: 'ltr' }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

// Offline Status Component
const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    
    if (offlineData.visits.length === 0 && offlineData.orders.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/offline/sync`, offlineData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear offline data after successful sync
      localStorage.removeItem('offline_data');
      setPendingSync([]);
      
      console.log('Offline data synced successfully:', response.data);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const addOfflineData = (type, data) => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    offlineData[type].push({
      ...data,
      local_id: Date.now().toString(),
      offline_created_at: new Date().toISOString()
    });
    localStorage.setItem('offline_data', JSON.stringify(offlineData));
    setPendingSync([...pendingSync, { type, data }]);
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl">📡</span>
        <div className="flex-1">
          <div className="font-medium">وضع عدم الاتصال</div>
          <div className="text-sm">سيتم مزامنة البيانات عند عودة الاتصال</div>
          {pendingSync.length > 0 && (
            <div className="text-xs mt-1">
              {pendingSync.length} عناصر في انتظار المزامنة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Accounting Role Component
const AccountingDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending orders (manager approved, waiting for accounting)
      const pendingRes = await axios.get(`${API}/orders?status=MANAGER_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(pendingRes.data);

      // Fetch accounting approved orders
      const approvedRes = await axios.get(`${API}/orders?status=ACCOUNTING_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedOrders(approvedRes.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/orders/${orderId}/approve`, {
        notes: approvalNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('خطأ في الموافقة على الطلبية');
    }
  };

  const getOrderTotal = (order) => {
    return order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-yellow rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">لوحة تحكم المحاسبة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                مراجعة وموافقة الطلبيات المالية
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{pendingOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تحتاج موافقة</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{approvedOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تمت الموافقة عليها</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {pendingOrders.reduce((total, order) => total + getOrderTotal(order), 0).toLocaleString()} ريال
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي القيمة المعلقة</div>
          </div>
        </div>

        {/* Pending Orders for Approval */}
        <div className="card-modern mb-8">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>⏳</span>
              <span>طلبيات تحتاج موافقة المحاسبة ({pendingOrders.length})</span>
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          #{order.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.sales_rep_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.clinic_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-green-600">
                          {getOrderTotal(order).toLocaleString()} ريال
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowApprovalModal(true);
                            }}
                            className="btn-success text-xs px-3 py-1"
                            title="موافقة"
                          >
                            ✅ موافقة
                          </button>
                          <button
                            className="btn-info text-xs px-3 py-1"
                            title="تفاصيل"
                          >
                            👁️ تفاصيل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved Orders */}
        <div className="card-modern">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>✅</span>
              <span>طلبيات تمت الموافقة عليها ({approvedOrders.length})</span>
            </h3>
          </div>
          
          <div className="table-modern">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الموافقة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {approvedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        #{order.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.sales_rep_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.clinic_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {getOrderTotal(order).toLocaleString()} ريال
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {order.approved_at_accounting ? 
                          new Date(order.approved_at_accounting).toLocaleDateString('ar-EG') : 
                          'غير محدد'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-modern badge-success">
                        في انتظار المخزن
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">💰 موافقة الطلبية</h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Details */}
                <div className="card-modern p-4">
                  <h4 className="font-bold mb-3">تفاصيل الطلبية:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">رقم الطلبية:</span>
                      <span className="mr-2">#{selectedOrder.id.substring(0, 8)}</span>
                    </div>
                    <div>
                      <span className="font-medium">المندوب:</span>
                      <span className="mr-2">{selectedOrder.sales_rep_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">العيادة:</span>
                      <span className="mr-2">{selectedOrder.clinic_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">إجمالي القيمة:</span>
                      <span className="mr-2 text-green-600 font-bold">
                        {getOrderTotal(selectedOrder).toLocaleString()} ريال
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-bold mb-2">ملاحظات الموافقة:</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={4}
                    className="form-modern w-full"
                    placeholder="أضف أي ملاحظات خاصة بالموافقة المالية..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => approveOrder(selectedOrder.id)}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    <span>الموافقة على الطلبية</span>
                  </button>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Warehouse Management Component
const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState({});
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { language } = useContext(ThemeContext);

  // Egyptian warehouses configuration
  const egyptianWarehouses = [
    { id: 'WH_CAIRO', name: 'مخزن القاهرة', city: 'Cairo', region: 'Greater Cairo' },
    { id: 'WH_ALEX', name: 'مخزن الإسكندرية', city: 'Alexandria', region: 'Alexandria' },
    { id: 'WH_GIZA', name: 'مخزن الجيزة', city: 'Giza', region: 'Greater Cairo' },
    { id: 'WH_MANSOURA', name: 'مخزن المنصورة', city: 'Mansoura', region: 'Dakahlia' },
    { id: 'WH_ASWAN', name: 'مخزن أسوان', city: 'Aswan', region: 'Upper Egypt' }
  ];

  const translations = {
    en: {
      title: "🏪 Comprehensive Warehouse Management",
      subtitle: "Complete management of warehouses, inventory and orders",
      dashboard: "Dashboard",
      inventory: "Inventory Management", 
      orders: "Orders",
      movements: "Movement Log",
      warehouseOverview: "Warehouse Overview",
      urgentActions: "🚨 Urgent Actions Required",
      lowStock: "Low Stock Alert",
      pendingApproval: "Pending Approval",
      criticalIssues: "Critical Issues"
    },
    ar: {
      title: "🏪 إدارة المخازن الشاملة",
      subtitle: "إدارة كاملة للمخازن والمخزون والطلبات",
      dashboard: "لوحة التحكم",
      inventory: "إدارة المخزن",
      orders: "الطلبات", 
      movements: "سجل الحركات",
      warehouseOverview: "نظرة عامة على المخازن",
      urgentActions: "🚨 إجراءات عاجلة مطلوبة",
      lowStock: "تنبيه نقص مخزون",
      pendingApproval: "في انتظار الموافقة",
      criticalIssues: "مشاكل حرجة"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all warehouse data
      const [warehousesRes, statsRes, inventoryRes, ordersRes, movementsRes] = await Promise.all([
        axios.get(`${API}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/dashboard/warehouse-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/warehouses/movements`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setWarehouses(warehousesRes.data);
      setWarehouseStats(statsRes.data);
      setInventory(inventoryRes.data);
      setPendingOrders(ordersRes.data);
      setMovements(movementsRes.data);

    } catch (error) {
      // Mock data for demonstration
      setWarehouses(egyptianWarehouses);
      setWarehouseStats({
        total_value: 485000,
        low_stock_count: 12,
        pending_orders_count: 8,
        movement_today: 45
      });
      setInventory([
        { id: 1, name: 'أكسزوم 500مج', warehouse: 'مخزن القاهرة', quantity: 120, min_stock: 50, unit_price: 25.50, category: 'أدوية' },
        { id: 2, name: 'فيتامين د3', warehouse: 'مخزن الإسكندرية', quantity: 8, min_stock: 30, unit_price: 45.00, category: 'فيتامينات' },
        { id: 3, name: 'باراسيتامول', warehouse: 'مخزن الجيزة', quantity: 200, min_stock: 100, unit_price: 12.75, category: 'مسكنات' },
        { id: 4, name: 'أوميجا 3', warehouse: 'مخزن المنصورة', quantity: 15, min_stock: 25, unit_price: 65.00, category: 'مكملات' },
        { id: 5, name: 'كالسيوم مغنيسيوم', warehouse: 'مخزن أسوان', quantity: 75, min_stock: 40, unit_price: 38.25, category: 'مكملات' }
      ]);
      setPendingOrders([
        { id: 'ORD-001', clinic: 'عيادة النور', items: 5, total: 1250, status: 'pending_manager', sales_rep: 'محمود علي', warehouse: 'مخزن القاهرة' },
        { id: 'ORD-002', clinic: 'عيادة الشفاء', items: 3, total: 850, status: 'pending_accounting', sales_rep: 'أحمد حسن', warehouse: 'مخزن الإسكندرية' },
        { id: 'ORD-003', clinic: 'عيادة الأمل', items: 7, total: 2100, status: 'pending_warehouse', sales_rep: 'فاطمة محمد', warehouse: 'مخزن المنصورة' }
      ]);
      setMovements([
        { id: 1, date: '2024-01-24', product: 'أكسزوم 500مج', requester: 'عيادة النور', region: 'القاهرة', movement_type: 'صرف', order_type: 'طلبية', quantity: 10, sales_rep: 'محمود علي', doctor: 'د. أحمد محمد', reason: 'طلبية عادية', comments: 'تم الصرف بنجاح', status: 'completed' },
        { id: 2, date: '2024-01-24', product: 'فيتامين د3', requester: 'عيادة الشفاء', region: 'الإسكندرية', movement_type: 'صرف', order_type: 'ديمو', quantity: 5, sales_rep: 'أحمد حسن', doctor: 'د. فاطمة علي', reason: 'عينة مجانية', comments: 'للتجربة', status: 'pending_approval' },
        { id: 3, date: '2024-01-23', product: 'باراسيتامول', requester: 'عيادة الأمل', region: 'الجيزة', movement_type: 'إدخال', order_type: 'تزويد', quantity: 100, sales_rep: 'إبراهيم خالد', doctor: '', reason: 'تزويد مخزون', comments: 'شحنة جديدة', status: 'completed' }
      ]);
      console.error('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-xl md:text-3xl">🏪</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">{t.title}</h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-2 overflow-x-auto bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg scrollbar-hide" style={{ direction: 'ltr' }}>
            {[
              { key: 'dashboard', label: t.dashboard, icon: '📊' },
              { key: 'inventory', label: t.inventory, icon: '📦' },
              { key: 'orders', label: t.orders, icon: '🛒' },
              { key: 'movements', label: t.movements, icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''} flex items-center whitespace-nowrap px-4 py-2 text-sm md:text-base`}
              >
                <span className="ml-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <WarehouseDashboard 
            stats={warehouseStats} 
            warehouses={warehouses}
            inventory={inventory}
            loading={loading}
            language={language}
          />
        )}
        
        {activeTab === 'inventory' && (
          <InventoryManagement 
            inventory={inventory}
            warehouses={warehouses}
            onRefresh={fetchWarehouseData}
            language={language}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManagement 
            orders={pendingOrders}
            onRefresh={fetchWarehouseData}
            language={language}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsLog 
            movements={movements}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

// Warehouse Dashboard Component
const WarehouseDashboard = ({ stats, warehouses, inventory, loading, language }) => {
  const t = language === 'ar' ? {
    warehouseOverview: 'نظرة عامة على المخازن',
    urgentActions: '🚨 إجراءات عاجلة مطلوبة',
    totalValue: 'إجمالي القيمة',
    lowStock: 'نقص مخزون',
    pendingOrders: 'طلبات معلقة',
    todayMovements: 'حركات اليوم',
    warehouseDetails: 'تفاصيل المخازن',
    criticalAlerts: 'تنبيهات حرجة',
    needsAttention: 'يحتاج 3 عبوات اكسزوم',
    needsApproval: 'يحتاج موافقة أمين المخزن على الطلبية',
    stockShortage: 'يوجد نقص في منتج'
  } : {
    warehouseOverview: 'Warehouse Overview',
    urgentActions: '🚨 Urgent Actions Required',
    totalValue: 'Total Value',
    lowStock: 'Low Stock',
    pendingOrders: 'Pending Orders',
    todayMovements: 'Today Movements',
    warehouseDetails: 'Warehouse Details',
    criticalAlerts: 'Critical Alerts',
    needsAttention: 'Needs 3 units of Axozom',
    needsApproval: 'Needs warehouse manager approval',
    stockShortage: 'Stock shortage in product'
  };

  const criticalAlerts = [
    { warehouse: 'مخزن أبيس', message: t.needsAttention, type: 'stock', priority: 'high' },
    { warehouse: 'مخزن العصافرة', message: t.needsApproval, type: 'approval', priority: 'medium' },
    { warehouse: 'مخزن جليم', message: `${t.stockShortage} فيتامين د3`, type: 'shortage', priority: 'high' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.total_value?.toLocaleString() || '485,000'} جنيه</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.totalValue}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.low_stock_count || 12}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.lowStock}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.pending_orders_count || 8}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.pendingOrders}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.movement_today || 45}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.todayMovements}</div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🚨</span>
          <span>{t.urgentActions}</span>
        </h3>
        <div className="space-y-3">
          {criticalAlerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              alert.priority === 'high' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">{alert.warehouse}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                </div>
                <button className={`btn-sm ${alert.priority === 'high' ? 'btn-danger' : 'btn-warning'}`}>
                  {language === 'ar' ? 'عرض' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🏪</span>
          <span>{t.warehouseDetails}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => {
            const warehouseInventory = inventory.filter(item => item.warehouse === warehouse.name);
            const lowStockItems = warehouseInventory.filter(item => item.quantity <= item.min_stock);
            
            return (
              <div key={warehouse.id} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{warehouse.name}</h4>
                    <p className="text-sm text-gray-600">{warehouse.city} • {warehouse.region}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${lowStockItems.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}:</span>
                    <span className="font-bold">{warehouseInventory.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'نقص مخزون' : 'Low Stock'}:</span>
                    <span className={`font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {lowStockItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'القيمة التقديرية' : 'Estimated Value'}:</span>
                    <span className="font-bold text-blue-600">
                      {warehouseInventory.reduce((total, item) => total + (item.quantity * item.unit_price), 0).toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                    </span>
                  </div>
                </div>
                
                <button className="btn-primary w-full mt-4 text-sm">
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Reports Component

// Reports Component
const ReportsSection = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [usersReport, setUsersReport] = useState(null);
  const [activeReport, setActiveReport] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeReport === 'inventory') {
      fetchInventoryReport();
    } else if (activeReport === 'users') {
      fetchUsersReport();
    }
  }, [activeReport]);

  const fetchInventoryReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المخزون');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return inventoryReport.reduce((total, item) => total + item.total_value, 0).toFixed(2);
  };

  const getLowStockCount = () => {
    return inventoryReport.filter(item => item.low_stock).length;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المخزون
          </button>
          <button
            onClick={() => setActiveReport('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المستخدمين
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل التقرير...</p>
          </div>
        )}

        {/* Inventory Report */}
        {activeReport === 'inventory' && !isLoading && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المخزون الشامل</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي قيمة المخزون</h3>
                <p className="text-2xl font-bold text-blue-600">{getTotalInventoryValue()} ريال</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">منتجات نقص مخزون</h3>
                <p className="text-2xl font-bold text-red-600">{getLowStockCount()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">إجمالي المنتجات</h3>
                <p className="text-2xl font-bold text-green-600">{inventoryReport.length}</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المخزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القيمة الإجمالية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryReport.map((item, index) => (
                    <tr key={index} className={item.low_stock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_value.toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.low_stock
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.low_stock ? 'نقص مخزون' : 'متوفر'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Report */}
        {activeReport === 'users' && !isLoading && usersReport && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المستخدمين</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي المستخدمين</h3>
                <p className="text-2xl font-bold text-blue-600">{usersReport.total_users}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">مستخدمين نشطين</h3>
                <p className="text-2xl font-bold text-green-600">{usersReport.active_distribution.active}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">مستخدمين معطلين</h3>
                <p className="text-2xl font-bold text-red-600">{usersReport.active_distribution.inactive}</p>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الأدوار</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(usersReport.role_distribution).map(([role, count]) => {
                  const roleNames = {
                    admin: 'أدمن',
                    warehouse_manager: 'مدير مخزن',
                    manager: 'مدير',
                    sales_rep: 'مندوب'
                  };
                  return (
                    <div key={role} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">{roleNames[role] || role}</p>
                      <p className="text-xl font-bold text-gray-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersReport.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.full_name}
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.role === 'admin' && 'أدمن'}
                        {user.role === 'warehouse_manager' && 'مدير مخزن'}
                        {user.role === 'manager' && 'مدير'}
                        {user.role === 'sales_rep' && 'مندوب'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Sales Rep Dashboard with Selfie and Daily Plan
const SalesRepDashboard = ({ stats, user }) => {
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [selfieToday, setSelfieToday] = useState(null);
  const { language } = useContext(ThemeContext);

  useEffect(() => {
    checkDailySelfie();
  }, []);

  const checkDailySelfie = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/users/selfie/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.selfie) {
        setSelfieToday(response.data.selfie);
      } else {
        // Show selfie capture if no selfie taken today
        setShowSelfieCapture(true);
      }
    } catch (error) {
      // If API doesn't exist, show selfie capture for demo
      setShowSelfieCapture(true);
    }
  };

  const handleSelfieCapture = (imageData) => {
    setSelfieToday(imageData);
    setShowSelfieCapture(false);
    setShowDailyPlan(true); // Show daily plan after selfie
  };

  const handleSelfieSkip = () => {
    setShowSelfieCapture(false);
    setShowDailyPlan(true); // Show daily plan anyway
  };

  const translations = {
    en: {
      welcome: "👋 Welcome back",
      todayStats: "Today's Performance",
      visitsToday: "Visits Today",
      ordersToday: "Orders Today",
      clinicsAdded: "Clinics Added",
      efficiency: "Efficiency Rate",
      quickActions: "⚡ Quick Actions",
      newVisit: "👨‍⚕️ New Visit",
      newOrder: "📦 New Order",
      addClinic: "🏥 Add Clinic",
      viewPlan: "📋 View Daily Plan",
      todaySelfie: "📷 Today's Check-in",
      retakeSelfie: "🔄 Retake Selfie"
    },
    ar: {
      welcome: "👋 مرحباً بعودتك",
      todayStats: "أداء اليوم",
      visitsToday: "زيارات اليوم",
      ordersToday: "طلبات اليوم", 
      clinicsAdded: "عيادات مضافة",
      efficiency: "معدل الكفاءة",
      quickActions: "⚡ إجراءات سريعة",
      newVisit: "👨‍⚕️ زيارة جديدة",
      newOrder: "📦 طلبة جديدة", 
      addClinic: "🏥 إضافة عيادة",
      viewPlan: "📋 عرض خطة اليوم",
      todaySelfie: "📷 تسجيل حضور اليوم",
      retakeSelfie: "🔄 إعادة التقاط سيلفي"
    }
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gradient mb-2">
                  {t.welcome}, {user.full_name}! 🌟
                </h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {selfieToday && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">{t.todaySelfie}</div>
                    <img 
                      src={selfieToday} 
                      alt="Today's selfie"
                      className="w-16 h-16 rounded-full object-cover border-4 border-green-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowSelfieCapture(true)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    {t.retakeSelfie}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Today's Performance Stats */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>{t.todayStats}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.today_visits || 0}</div>
                <div className="text-sm text-gray-600">{t.visitsToday}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.today_orders || 0}</div>
                <div className="text-sm text-gray-600">{t.ordersToday}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.clinics_added || 0}</div>
                <div className="text-sm text-gray-600">{t.clinicsAdded}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.efficiency_rate || '85'}%</div>
                <div className="text-sm text-gray-600">{t.efficiency}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>{t.quickActions}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="btn-primary flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">👨‍⚕️</span>
                <span>{t.newVisit}</span>
              </button>
              <button className="btn-success flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">📦</span>
                <span>{t.newOrder}</span>
              </button>
              <button className="btn-info flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">🏥</span>
                <span>{t.addClinic}</span>
              </button>
              <button 
                onClick={() => setShowDailyPlan(true)}
                className="btn-warning flex flex-col items-center gap-2 py-6"
              >
                <span className="text-3xl">📋</span>
                <span>{t.viewPlan}</span>
              </button>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span>
                <span>{language === 'ar' ? 'أداء الأسبوع' : 'Weekly Performance'}</span>
              </h3>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">
                    {language === 'ar' ? 'رسم بياني لأدائك الأسبوعي' : 'Your Weekly Performance Chart'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🏆</span>
                <span>{language === 'ar' ? 'إنجازات الشهر' : 'Monthly Achievements'}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥇</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'أفضل مندوب للشهر' : 'Top Rep of the Month'}
                    </span>
                  </div>
                  <span className="text-yellow-600 font-bold">
                    {language === 'ar' ? 'مكتمل' : 'Achieved'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'تحقيق هدف الزيارات' : 'Visits Target Met'}
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">95%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'تحقيق هدف المبيعات' : 'Sales Target Met'}
                    </span>
                  </div>
                  <span className="text-green-600 font-bold">110%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selfie Capture Modal */}
      {showSelfieCapture && (
        <SelfieCapture 
          onCapture={handleSelfieCapture}
          onSkip={handleSelfieSkip}
        />
      )}

      {/* Daily Plan Modal */}
      {showDailyPlan && (
        <DailyPlan 
          user={user}
          onClose={() => setShowDailyPlan(false)}
        />
      )}
    </>
  );
};

// Clinic Registration Component
const ClinicRegistration = () => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    doctor_name: '',
    clinic_class: '',
    doctor_address: '',
    clinic_manager_name: '',
    address: '',
    notes: '',
    clinic_image: ''
  });
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Convert coordinates to address (placeholder - will be enhanced with Google Maps)
          try {
            setLocationAddress(`الموقع: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          } catch (error) {
            setLocationAddress(`${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          }
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, clinic_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل العيادة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        doctor_specialty: formData.clinic_class, // Map clinic_class to doctor_specialty for backend
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post(`${API}/clinic-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال طلب تسجيل العيادة بنجاح. في انتظار موافقة المدير');
      setFormData({
        clinic_name: '',
        clinic_phone: '',
        doctor_name: '',
        clinic_class: '',
        doctor_address: '',
        clinic_manager_name: '',
        address: '',
        notes: '',
        clinic_image: ''
      });
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeToggle />
      <div className="card-modern p-8 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">🏥</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">تسجيل عيادة جديدة</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>أضف عيادة طبية جديدة إلى النظام</p>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 form-modern">
          {/* Location Banner */}
          <div className="card-gradient-success p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>الموقع الجغرافي الحالي</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location ? (
                <>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📍</span>
                      <span className="font-bold">الإحداثيات:</span>
                    </div>
                    <p className="text-sm font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🏠</span>
                      <span className="font-bold">العنوان:</span>
                    </div>
                    <p className="text-sm">{locationAddress}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center">
                  <div className="gps-indicator">
                    <span>جاري تحديد الموقع...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Placeholder for Google Maps */}
            <div className="mt-6 h-48 glass-effect rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🗺️</span>
                <p className="font-bold">خريطة Google Maps</p>
                <p className="text-sm opacity-75">سيتم عرض الموقع هنا بعد إضافة مفتاح الخرائط</p>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">🏥 اسم العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                className="w-full"
                placeholder="مثال: عيادة النور الطبية"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📞 رقم العيادة</span>
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                className="w-full"
                placeholder="0501234567"
              />
            </div>
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👨‍⚕️ اسم الطبيب</span>
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                className="w-full"
                placeholder="د. أحمد محمد"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">🏆 تصنيف العيادة</span>
              </label>
              <select
                value={formData.clinic_class}
                onChange={(e) => setFormData({...formData, clinic_class: e.target.value})}
                className="w-full"
                required
              >
                <option value="">اختر تصنيف العيادة</option>
                <option value="A Class">A Class - عيادة درجة أولى</option>
                <option value="B Class">B Class - عيادة درجة ثانية</option>
                <option value="C Class">C Class - عيادة درجة ثالثة</option>
              </select>
            </div>
          </div>

          <div>
            <label>
              <span className="text-shadow-glow">🏠 عنوان الطبيب</span>
            </label>
            <input
              type="text"
              value={formData.doctor_address}
              onChange={(e) => setFormData({...formData, doctor_address: e.target.value})}
              className="w-full"
              placeholder="حي الملز، شارع الملك فهد"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👔 المسؤول عن إدارة العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_manager_name}
                onChange={(e) => setFormData({...formData, clinic_manager_name: e.target.value})}
                className="w-full"
                placeholder="اسم مدير العيادة"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📍 عنوان العيادة</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full"
                placeholder="العنوان الكامل للعيادة"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label>
              <span className="text-shadow-glow">📸 صورة العيادة من الخارج (اختياري)</span>
            </label>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-4 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 transition-colors"
                style={{ 
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--brand-orange)',
                  borderOpacity: 0.3
                }}
              />
              {formData.clinic_image && (
                <div className="mt-4">
                  <img
                    src={formData.clinic_image}
                    alt="صورة العيادة"
                    className="h-48 w-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label>
              <span className="text-shadow-glow">📝 ملاحظات العيادة</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={5}
              className="w-full"
              placeholder="أضف أي ملاحظات مهمة عن العيادة، ساعات العمل، أو معلومات خاصة..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !location}
            className="w-full btn-primary text-xl py-4 neon-glow"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                <span>جاري الإرسال...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span>🚀</span>
                <span>إرسال طلب تسجيل العيادة</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

// Order Creation Component
const OrderCreation = () => {
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orderData, setOrderData] = useState({
    doctor_id: '',
    order_type: 'DEMO',
    warehouse_id: '',
    notes: '',
    items: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show approved doctors
      setDoctors(response.data.filter(doctor => doctor.approved_by));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && !selectedProducts.find(p => p.id === productId)) {
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? {...p, quantity: parseInt(quantity)} : p
    ));
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const doctor = doctors.find(d => d.id === orderData.doctor_id);
      
      const requestData = {
        ...orderData,
        clinic_id: doctor.clinic_id,
        items: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity
        }))
      };

      await axios.post(`${API}/orders`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال الطلبية بنجاح. في انتظار موافقة المدير');
      setOrderData({
        doctor_id: '',
        order_type: 'DEMO',
        warehouse_id: '',
        notes: '',
        items: []
      });
      setSelectedProducts([]);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلبية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">عمل طلبية</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اختيار الطبيب</label>
          <select
            value={orderData.doctor_id}
            onChange={(e) => setOrderData({...orderData, doctor_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلبية</label>
            <select
              value={orderData.order_type}
              onChange={(e) => setOrderData({...orderData, order_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEMO">ديمو (مجاني)</option>
              <option value="SALE">أوردر مدفوع</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المخزن</label>
            <select
              value={orderData.warehouse_id}
              onChange={(e) => setOrderData({...orderData, warehouse_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- اختر المخزن --</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتجات</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addProductToOrder(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر منتج لإضافته --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price} ريال ({product.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المنتجات المختارة</h3>
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.price} ريال / {product.unit}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {(product.price * product.quantity).toFixed(2)} ريال
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">إجمالي الطلبية:</span>
                  <span className="text-xl font-bold text-blue-600">{getTotalAmount().toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الأوردر</label>
          <textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف أي ملاحظات خاصة بالطلبية..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedProducts.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال الطلبية'}
        </button>
      </form>
    </div>
  );
};

const VisitRegistration = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [currentVisitId, setCurrentVisitId] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          if (currentVisitId) {
            await addVoiceNote(currentVisitId, base64Audio, blob.size / 1000); // duration in seconds estimate
          } else {
            // Store temporarily until visit is created
            setVoiceNotes([...voiceNotes, { audio: base64Audio, duration: blob.size / 1000 }]);
          }
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('خطأ في بدء تسجيل الصوت');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const addVoiceNote = async (visitId, audioData, duration) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visits/${visitId}/voice-notes`, {
        audio_data: audioData,
        duration: Math.round(duration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إضافة الملاحظة الصوتية بنجاح');
    } catch (error) {
      console.error('Error adding voice note:', error);
      setError('خطأ في إضافة الملاحظة الصوتية');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل الزيارة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/visits`, {
        doctor_id: selectedDoctor,
        clinic_id: selectedClinic,
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentVisitId(response.data.visit_id);
      
      // Add any pending voice notes
      for (const voiceNote of voiceNotes) {
        await addVoiceNote(response.data.visit_id, voiceNote.audio, voiceNote.duration);
      }
      setVoiceNotes([]);

      setSuccess('تم تسجيل الزيارة بنجاح');
      setSelectedDoctor('');
      setSelectedClinic('');
      setNotes('');
      setCurrentVisitId(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في تسجيل الزيارة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">تسجيل زيارة جديدة</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر الطبيب
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر العيادة
          </label>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر العيادة --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name} - {clinic.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات الزيارة
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف تفاصيل الزيارة..."
            required
          />
        </div>

        {/* Voice Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات صوتية (اختيارية)
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="ml-2">🛑</span>
                    إيقاف التسجيل
                  </>
                ) : (
                  <>
                    <span className="ml-2">🎤</span>
                    بدء تسجيل صوتي
                  </>
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">جاري التسجيل...</span>
                </div>
              )}
            </div>

            {voiceNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">الملاحظات الصوتية المسجلة:</h4>
                {voiceNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">🎵</span>
                    <audio controls className="flex-1 h-8">
                      <source src={note.audio} type="audio/wav" />
                    </audio>
                    <span className="text-xs text-gray-500">
                      {Math.round(note.duration)}ث
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              💡 يمكنك تسجيل عدة ملاحظات صوتية لحفظ تفاصيل مهمة أثناء الزيارة
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 ml-2">📍</div>
            <div>
              <p className="text-sm font-medium text-blue-800">الموقع الحالي</p>
              {location ? (
                <p className="text-xs text-blue-600">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-blue-600">جاري تحديد الموقع...</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !location}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التسجيل...' : 'تسجيل الزيارة'}
        </button>
      </form>
    </div>
  );
};

// Inventory Management Component
const InventoryManagement = ({ inventory, warehouses, onRefresh, language }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const t = language === 'ar' ? {
    inventoryTitle: 'إدارة المخزون الشامل',
    warehouse: 'المخزن',
    allWarehouses: 'جميع المخازن',
    search: 'بحث في المنتجات...',
    category: 'الفئة',
    allCategories: 'جميع الفئات',
    productName: 'اسم المنتج',
    quantity: 'الكمية',
    minStock: 'أقل مخزون',
    unitPrice: 'سعر الوحدة',
    totalValue: 'القيمة الإجمالية',
    status: 'الحالة',
    actions: 'الإجراءات',
    inStock: 'متوفر',
    lowStock: 'نقص مخزون',
    outOfStock: 'نفد المخزون',
    edit: 'تعديل',
    view: 'عرض'
  } : {
    inventoryTitle: 'Comprehensive Inventory Management',
    warehouse: 'Warehouse',
    allWarehouses: 'All Warehouses',
    search: 'Search products...',
    category: 'Category',
    allCategories: 'All Categories',
    productName: 'Product Name',
    quantity: 'Quantity',
    minStock: 'Min Stock',
    unitPrice: 'Unit Price',
    totalValue: 'Total Value',
    status: 'Status',
    actions: 'Actions',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    edit: 'Edit',
    view: 'View'
  };

  const filteredInventory = inventory.filter(item => {
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse === selectedWarehouse;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesWarehouse && matchesSearch && matchesCategory;
  });

  const getStatusInfo = (item) => {
    if (item.quantity === 0) return { text: t.outOfStock, color: 'text-red-600', bg: 'bg-red-100' };
    if (item.quantity <= item.min_stock) return { text: t.lowStock, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: t.inStock, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const categories = [...new Set(inventory.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📦</span>
          <span>{t.inventoryTitle}</span>
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">{t.warehouse}:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allWarehouses}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.search}:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="form-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.category}:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="table-modern overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.productName}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.warehouse}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.quantity}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.minStock}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.unitPrice}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.totalValue}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStatusInfo(item);
                const totalValue = item.quantity * item.unit_price;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-lg">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.warehouse}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{item.min_stock}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.unit_price.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {totalValue.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="btn-info text-xs px-3 py-1" title={t.view}>
                          👁️
                        </button>
                        <button className="btn-primary text-xs px-3 py-1" title={t.edit}>
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Orders Management Component
const OrdersManagement = ({ orders, onRefresh, language }) => {
  const t = language === 'ar' ? {
    ordersTitle: 'إدارة الطلبات المنتظرة',
    orderId: 'رقم الطلبية',
    clinic: 'العيادة',
    salesRep: 'المندوب',
    warehouse: 'المخزن',
    items: 'عدد العناصر',
    total: 'الإجمالي',
    status: 'الحالة',
    actions: 'الإجراءات',
    pendingManager: 'في انتظار المدير',
    pendingAccounting: 'في انتظار المحاسبة',
    pendingWarehouse: 'في انتظار المخزن',
    approve: 'موافقة',
    reject: 'رفض',
    view: 'عرض'
  } : {
    ordersTitle: 'Pending Orders Management',
    orderId: 'Order ID',
    clinic: 'Clinic',
    salesRep: 'Sales Rep',
    warehouse: 'Warehouse',
    items: 'Items',
    total: 'Total',
    status: 'Status',
    actions: 'Actions',
    pendingManager: 'Pending Manager',
    pendingAccounting: 'Pending Accounting',
    pendingWarehouse: 'Pending Warehouse',
    approve: 'Approve',
    reject: 'Reject',
    view: 'View'
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_manager':
        return { text: t.pendingManager, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'pending_accounting':
        return { text: t.pendingAccounting, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'pending_warehouse':
        return { text: t.pendingWarehouse, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🛒</span>
          <span>{t.ordersTitle}</span>
        </h3>

        <div className="table-modern overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.orderId}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.clinic}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.salesRep}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.warehouse}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.items}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.total}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = getStatusInfo(order.status);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.clinic}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.sales_rep}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.warehouse}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center font-bold">{order.items}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {order.total.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="btn-info text-xs px-3 py-1" title={t.view}>
                          👁️
                        </button>
                        <button className="btn-success text-xs px-3 py-1" title={t.approve}>
                          ✅
                        </button>
                        <button className="btn-danger text-xs px-3 py-1" title={t.reject}>
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Movements Log Component  
const MovementsLog = ({ movements, language }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const t = language === 'ar' ? {
    movementsTitle: 'سجل حركات المخزن',
    filterByDate: 'فلترة بالتاريخ',
    filterByType: 'فلترة بنوع الحركة',
    filterByStatus: 'فلترة بالحالة',
    allTypes: 'جميع الأنواع',
    allStatuses: 'جميع الحالات',
    date: 'التاريخ',
    product: 'المنتج',
    requester: 'الطالب',
    region: 'المنطقة',
    movementType: 'نوع الحركة',
    orderType: 'نوع الطلب',
    quantity: 'الكمية',
    salesRep: 'المندوب',
    doctor: 'الدكتور المستلم',
    reason: 'السبب',
    comments: 'تعليقات',
    status: 'الحالة',
    actions: 'الإجراءات',
    completed: 'تمت',
    pendingApproval: 'في انتظار الموافقة',
    review: 'مراجعة',
    cancel: 'إلغاء'
  } : {
    movementsTitle: 'Warehouse Movement Log',
    filterByDate: 'Filter by Date',
    filterByType: 'Filter by Type',
    filterByStatus: 'Filter by Status',
    allTypes: 'All Types',
    allStatuses: 'All Statuses',
    date: 'Date',
    product: 'Product',
    requester: 'Requester',
    region: 'Region',
    movementType: 'Movement Type',
    orderType: 'Order Type',
    quantity: 'Quantity',
    salesRep: 'Sales Rep',
    doctor: 'Receiving Doctor',
    reason: 'Reason',
    comments: 'Comments',
    status: 'Status',
    actions: 'Actions',
    completed: 'Completed',
    pendingApproval: 'Pending Approval',
    review: 'Review',
    cancel: 'Cancel'
  };

  const filteredMovements = movements.filter(movement => {
    const matchesDate = !filterDate || movement.date.includes(filterDate);
    const matchesType = filterType === 'all' || movement.movement_type === filterType;
    const matchesStatus = filterStatus === 'all' || movement.status === filterStatus;
    return matchesDate && matchesType && matchesStatus;
  });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: t.completed, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending_approval':
        return { text: t.pendingApproval, color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>{t.movementsTitle}</span>
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByDate}:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByType}:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allTypes}</option>
              <option value="صرف">{language === 'ar' ? 'صرف' : 'Dispatch'}</option>
              <option value="إدخال">{language === 'ar' ? 'إدخال' : 'Receive'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByStatus}:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="completed">{t.completed}</option>
              <option value="pending_approval">{t.pendingApproval}</option>
            </select>
          </div>
        </div>

        {/* Movements Table */}
        <div className="table-modern overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.date}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.product}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.requester}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.region}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.movementType}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.orderType}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.quantity}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.salesRep}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.doctor}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.reason}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.comments}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.status}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => {
                const status = getStatusInfo(movement.status);
                
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{movement.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{movement.product}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.requester}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.region}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        movement.movement_type === 'صرف' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.order_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center font-bold">{movement.quantity}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.sales_rep}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.doctor || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.reason}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.comments}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="btn-info text-xs px-2 py-1" title={t.review}>
                          👁️
                        </button>
                        <button className="btn-danger text-xs px-2 py-1" title={t.cancel}>
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchVisits();
    
    // Add event listener for navigation from admin actions
    const handleNavigation = (event) => {
      setActiveTab(event.detail);
    };
    
    window.addEventListener('navigateToTab', handleNavigation);
    
    return () => {
      window.removeEventListener('navigateToTab', handleNavigation);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'أدمن',
      warehouse_manager: 'مدير مخزن',
      manager: 'مدير',
      sales_rep: 'مندوب',
      accounting: 'محاسب'
    };
    return roles[role] || role;
  };

  const canAccessTab = (tabName) => {
    const permissions = {
      users: ['admin', 'warehouse_manager', 'manager'],
      warehouse: ['admin', 'warehouse_manager'],
      visit: ['sales_rep'],
      reports: ['admin', 'warehouse_manager', 'manager', 'accounting'],
      accounting: ['admin', 'accounting']
    };
    
    return permissions[tabName]?.includes(user.role) || false;
  };

  return (
    <>
      <ThemeToggle />
      <div className="min-h-screen page-transition">
        {/* Header */}
        <header className="header-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
                  <span className="text-3xl">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient">نظام إدارة المناديب</h1>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>مرحباً، {user.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎭</span>
                      <span className="badge-modern badge-info">{getRoleText(user.role)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <GlobalSearchBox />
                <LanguageSelector />
                <NotificationsCenter />
                <button
                  onClick={logout}
                  className="btn-warning flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4 overflow-x-auto bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📊</span>
              {user.role === 'admin' ? 'الإحصائيات' : 'لوحة التحكم'}
            </button>
            
            {canAccessTab('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-tab ${activeTab === 'users' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">👥</span>
                إدارة المستخدمين
              </button>
            )}
            
            {canAccessTab('warehouse') && (
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`nav-tab ${activeTab === 'warehouse' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏭</span>
                إدارة المخازن
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('clinic-registration')}
                className={`nav-tab ${activeTab === 'clinic-registration' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏥</span>
                تسجيل عيادة
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('order-creation')}
                className={`nav-tab ${activeTab === 'order-creation' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📦</span>
                عمل طلبية
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('visit')}
                className={`nav-tab ${activeTab === 'visit' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📝</span>
                تسجيل زيارة
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('visits')}
              className={`nav-tab ${activeTab === 'visits' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📋</span>
              سجل الزيارات
            </button>

            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`nav-tab ${activeTab === 'reports' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📈</span>
                التقارير
              </button>
            )}
            
            {/* Accounting tab for accounting role */}
            {canAccessTab('accounting') && (
              <button
                onClick={() => setActiveTab('accounting')}
                className={`nav-tab ${activeTab === 'accounting' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">💰</span>
                المحاسبة
              </button>
            )}
            
            {/* Chat System for all users */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`nav-tab ${activeTab === 'chat' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">💬</span>
              المحادثات
            </button>
            
            {/* System Settings only for Admin */}
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`nav-tab ${activeTab === 'settings' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">⚙️</span>
                إعدادات النظام
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && user.role === 'sales_rep' && (
          <SalesRepDashboard stats={stats} user={user} />
        )}

        {activeTab === 'dashboard' && user.role !== 'sales_rep' && (
          <EnhancedStatisticsDashboard stats={stats} user={user} />
        )}

        {activeTab === 'clinic-registration' && user.role === 'sales_rep' && (
          <ClinicRegistration />
        )}

        {activeTab === 'order-creation' && user.role === 'sales_rep' && (
          <OrderCreation />
        )}

        {activeTab === 'users' && canAccessTab('users') && (
          <EnhancedUserManagement />
        )}

        {activeTab === 'warehouse' && canAccessTab('warehouse') && (
          <WarehouseManagement />
        )}

        {activeTab === 'visit' && user.role === 'sales_rep' && (
          <VisitRegistration />
        )}

        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">سجل الزيارات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطبيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العيادة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(visit.visit_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.clinic_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visit.is_effective === null
                            ? 'bg-yellow-100 text-yellow-800'
                            : visit.is_effective
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visit.is_effective === null
                            ? 'في انتظار المراجعة'
                            : visit.is_effective
                            ? 'مجدية'
                            : 'غير مجدية'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && canAccessTab('reports') && (
          <AdvancedReports />
        )}
        
        {activeTab === 'accounting' && canAccessTab('accounting') && (
          <AccountingDashboard />
        )}
        
        {activeTab === 'chat' && (
          <ChatSystem />
        )}
        
        {activeTab === 'settings' && user.role === 'admin' && (
          <SystemSettings />
        )}
        </div>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRScan = async (qrData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/qr/scan`, {
        content: qrData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.action === 'prefill_visit_form') {
        // Navigate to visit registration and prefill
        alert(`تم مسح عيادة: ${response.data.data.name}`);
      } else if (response.data.action === 'add_to_order') {
        // Navigate to order creation and add product
        alert(`تم مسح منتج: ${response.data.data.name}`);
      }
      
      setShowQRScanner(false);
    } catch (error) {
      console.error('QR scan error:', error);
      alert('خطأ في معالجة QR Code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 loading-shimmer rounded-full mx-auto mb-6"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {user ? <Dashboard /> : <LoginPage />}
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner 
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
      
      {/* Offline Status */}
      <OfflineStatus />
      
      {/* Floating QR Scanner Button */}
      {user && (
        <button
          onClick={() => setShowQRScanner(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center justify-center"
          title="مسح QR Code"
        >
          <span className="text-xl">📱</span>
        </button>
      )}
    </div>
  );
};

export default App;