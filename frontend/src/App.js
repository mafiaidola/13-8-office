// Medical Management System - Main Application (Reorganized & Centralized)
// النظام الرئيسي لإدارة المؤسسات الطبية - منظم ومركزي

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import './App.css';
import './styles/dark-theme.css'; // Import comprehensive dark theme styles
import axios from 'axios';

// Modern Professional Header Import
import ModernProfessionalHeader from './components/Common/ModernProfessionalHeader.js';

// Modern Sidebar Import
import ModernSidebar from './components/Navigation/ModernSidebar.js';

// Central System Imports
import { 
  SYSTEM_TABS, 
  USER_ROLES, 
  getAvailableTabs,
  hasPermission,
  normalizeRole 
} from './config/systemConfig.js';
import NavigationSystem from './components/Navigation/NavigationSystem.js';
import { ComponentRenderer, ComponentRegistry } from './components/Core/ComponentRegistry.js';
import { useTranslation } from './localization/translations.js';

// Integrated Financial System
import IntegratedFinancialDashboard from './components/Financial/IntegratedFinancialDashboard.js';

// API Configuration
const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

// Context Definitions
const ThemeContext = createContext();
const AuthContext = createContext();

// 8 ثيمات احترافية متطورة - 8 Advanced Professional Themes
const AVAILABLE_THEMES = {
  // 1. الثيم الداكن الكلاسيكي - Classic Dark Theme
  dark: {
    name: { ar: 'داكن كلاسيكي', en: 'Classic Dark' },
    colors: {
      background: '#0f172a',
      card: '#1e293b',
      surface: '#334155',
      text: '#ffffff',
      textSecondary: '#e2e8f0',
      accent: '#3b82f6',
      accentSecondary: '#2563eb',
      border: '#475569'
    }
  },
  
  // 2. ثيم الأزرق الاحترافي - Professional Blue Theme
  professional: {
    name: { ar: 'أزرق احترافي', en: 'Professional Blue' },
    colors: {
      background: '#1e3a8a',
      card: '#1e40af',
      surface: '#3b82f6',
      text: '#ffffff',
      textSecondary: '#dbeafe',
      accent: '#60a5fa',
      accentSecondary: '#3b82f6',
      border: '#2563eb'
    }
  },
  
  // 3. ثيم البنفسجي الملكي - Royal Purple Theme
  royal: {
    name: { ar: 'بنفسجي ملكي', en: 'Royal Purple' },
    colors: {
      background: '#581c87',
      card: '#7c3aed',
      surface: '#8b5cf6',
      text: '#ffffff',
      textSecondary: '#e9d5ff',
      accent: '#a78bfa',
      accentSecondary: '#8b5cf6',
      border: '#7c3aed'
    }
  },
  
  // 4. ثيم الأخضر الطبي - Medical Green Theme
  medical: {
    name: { ar: 'أخضر طبي', en: 'Medical Green' },
    colors: {
      background: '#14532d',
      card: '#16a34a',
      surface: '#22c55e',
      text: '#ffffff',
      textSecondary: '#dcfce7',
      accent: '#4ade80',
      accentSecondary: '#22c55e',
      border: '#16a34a'
    }
  },
  
  // 5. ثيم الذهبي الفاخر - Luxury Gold Theme
  luxury: {
    name: { ar: 'ذهبي فاخر', en: 'Luxury Gold' },
    colors: {
      background: '#92400e',
      card: '#d97706',
      surface: '#f59e0b',
      text: '#ffffff',
      textSecondary: '#fef3c7',
      accent: '#fbbf24',
      accentSecondary: '#f59e0b',
      border: '#d97706'
    }
  },
  
  // 6. ثيم الأحمر القوي - Power Red Theme
  power: {
    name: { ar: 'أحمر قوي', en: 'Power Red' },
    colors: {
      background: '#991b1b',
      card: '#dc2626',
      surface: '#ef4444',
      text: '#ffffff',
      textSecondary: '#fecaca',
      accent: '#f87171',
      accentSecondary: '#ef4444',
      border: '#dc2626'
    }
  },
  
  // 7. ثيم الرمادي المتطور - Advanced Gray Theme
  slate: {
    name: { ar: 'رمادي متطور', en: 'Advanced Slate' },
    colors: {
      background: '#0f172a',
      card: '#334155',
      surface: '#475569',
      text: '#ffffff',
      textSecondary: '#cbd5e1',
      accent: '#64748b',
      accentSecondary: '#475569',
      border: '#64748b'
    }
  },
  
  // 8. ثيم الليل العميق - Deep Night Theme
  midnight: {
    name: { ar: 'ليل عميق', en: 'Deep Night' },
    colors: {
      background: '#000000',
      card: '#111827',
      surface: '#1f2937',
      text: '#ffffff',
      textSecondary: '#d1d5db',
      accent: '#6366f1',
      accentSecondary: '#4f46e5',
      border: '#374151'
    }
  }
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [isRTL, setIsRTL] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Apply theme to body element - Enhanced with comprehensive theme system
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const currentThemeConfig = AVAILABLE_THEMES[theme];
    
    if (!currentThemeConfig) {
      console.warn(`Theme ${theme} not found, defaulting to dark`);
      return;
    }
    
    // Remove all existing theme classes
    const existingThemeClasses = ['theme-dark', 'theme-professional', 'theme-royal', 'theme-medical', 'theme-luxury', 'theme-power', 'theme-slate', 'theme-midnight'];
    body.classList.remove(...existingThemeClasses);
    html.classList.remove(...existingThemeClasses);
    
    // Apply current theme
    const themeClass = `theme-${theme}`;
    body.classList.add(themeClass);
    html.classList.add(themeClass);
    
    // Set comprehensive CSS variables for the theme
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-primary', currentThemeConfig.colors.background);
    root.style.setProperty('--theme-bg-card', currentThemeConfig.colors.card);
    root.style.setProperty('--theme-bg-surface', currentThemeConfig.colors.surface);
    root.style.setProperty('--theme-text-primary', currentThemeConfig.colors.text);
    root.style.setProperty('--theme-text-secondary', currentThemeConfig.colors.textSecondary);
    root.style.setProperty('--theme-accent', currentThemeConfig.colors.accent);
    root.style.setProperty('--theme-accent-secondary', currentThemeConfig.colors.accentSecondary);
    root.style.setProperty('--theme-border', currentThemeConfig.colors.border);
    
    // Apply gradient background
    body.style.background = `linear-gradient(135deg, ${currentThemeConfig.colors.background}, ${currentThemeConfig.colors.card})`;
    body.style.color = currentThemeConfig.colors.text;
    
    console.log(`🎨 Enhanced theme applied: ${theme} (${currentThemeConfig.name.en})`);
  }, [theme]);

  // Apply language and direction
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    console.log(`🌐 Language applied: ${language} (${isRTL ? 'RTL' : 'LTR'})`);
  }, [language, isRTL]);

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    setIsRTL(newLanguage === 'ar');
  };

  const changeTheme = (newTheme) => {
    if (AVAILABLE_THEMES[newTheme]) {
      setTheme(newTheme);
      console.log(`🎨 Changing to advanced theme: ${newTheme} (${AVAILABLE_THEMES[newTheme].name.en})`);
      
      // Apply theme immediately with advanced color system
      setTimeout(() => {
        const existingThemeClasses = ['theme-dark', 'theme-professional', 'theme-royal', 'theme-medical', 'theme-luxury', 'theme-power', 'theme-slate', 'theme-midnight'];
        document.body.classList.remove(...existingThemeClasses);
        document.body.classList.add(`theme-${newTheme}`);
        
        // Apply advanced CSS variables for the selected theme
        const root = document.documentElement;
        const themeConfig = AVAILABLE_THEMES[newTheme];
        
        root.style.setProperty('--theme-bg-primary', themeConfig.colors.background);
        root.style.setProperty('--theme-bg-card', themeConfig.colors.card);
        root.style.setProperty('--theme-bg-surface', themeConfig.colors.surface);
        root.style.setProperty('--theme-text-primary', themeConfig.colors.text);
        root.style.setProperty('--theme-text-secondary', themeConfig.colors.textSecondary);
        root.style.setProperty('--theme-accent', themeConfig.colors.accent);
        root.style.setProperty('--theme-accent-secondary', themeConfig.colors.accentSecondary);
        root.style.setProperty('--theme-border', themeConfig.colors.border);
        
        // Advanced theme-specific styling with professional gradients
        document.body.style.background = `linear-gradient(135deg, ${themeConfig.colors.background}, ${themeConfig.colors.card})`;
        document.body.style.color = themeConfig.colors.text;
        
        console.log(`✅ Advanced professional theme applied successfully: ${newTheme}`);
        
        // Dispatch advanced theme change event
        const event = new CustomEvent('advancedThemeChanged', { 
          detail: { 
            theme: newTheme, 
            config: themeConfig,
            timestamp: new Date().toISOString()
          } 
        });
        window.dispatchEvent(event);
      }, 10);
    }
  };

  const getCurrentTheme = () => AVAILABLE_THEMES[theme];

  return (
    <ThemeContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      isRTL,
      setIsRTL,
      toggleLanguage,
      changeTheme,
      getCurrentTheme,
      availableThemes: AVAILABLE_THEMES,
      showGlobalSearch,
      setShowGlobalSearch
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Simplified Authentication System
const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    user: null
  });

  const checkAuthStatus = useCallback(() => {
    console.log('🔍 Simple auth check started');
    
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token check:', token ? `EXISTS (${token.substring(0, 20)}...)` : 'NOT_FOUND');
    
    if (!token) {
      console.log('❌ No token, setting unauthenticated state');
      setAuthState({ loading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      // Decode JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid token format');
        localStorage.removeItem('access_token');
        setAuthState({ loading: false, isAuthenticated: false, user: null });
        return;
      }

      const payload = JSON.parse(atob(parts[1] + '='.repeat((4 - parts[1].length % 4) % 4)));
      console.log('🔍 Token decoded:', { username: payload.username, role: payload.role, exp: payload.exp });

      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp <= currentTime) {
        console.log('❌ Token expired');
        localStorage.removeItem('access_token');
        setAuthState({ loading: false, isAuthenticated: false, user: null });
        return;
      }

      // Valid token
      const user = {
        id: payload.user_id,
        username: payload.username,
        role: payload.role,
        full_name: payload.full_name || payload.username
      };

      console.log('✅ Valid token, user authenticated:', user);
      setAuthState({ loading: false, isAuthenticated: true, user });
      
    } catch (error) {
      console.error('❌ Token decode error:', error);
      localStorage.removeItem('access_token');
      setAuthState({ loading: false, isAuthenticated: false, user: null });
    }
  }, []);

  // Listen for storage changes and manual token updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        console.log('🔄 Token changed in localStorage, re-checking auth...');
        checkAuthStatus();
      }
    };

    const handleTokenInjected = () => {
      console.log('💉 Token injection event detected, re-checking auth...');
      setTimeout(checkAuthStatus, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokenInjected', handleTokenInjected);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenInjected', handleTokenInjected);
    };
  }, [checkAuthStatus]);

  const login = useCallback(async (credentials) => {
    console.log('🔄 Simple login started for:', credentials.username);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: credentials.username,
        password: credentials.password
      });

      console.log('📡 Login response:', { status: response.status, hasToken: !!response.data?.access_token });

      if (response.data?.access_token && response.data?.user) {
        localStorage.setItem('access_token', response.data.access_token);
        
        const user = response.data.user;
        console.log('✅ Login successful, updating state:', user);
        
        setAuthState({ loading: false, isAuthenticated: true, user });
        return { success: true, user };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('access_token');
    setAuthState({ loading: false, isAuthenticated: false, user: null });
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    // Expose debugging functions globally
    window.debugAuth = {
      checkAuth: checkAuthStatus,
      getToken: () => localStorage.getItem('access_token'),
      setToken: (token) => {
        localStorage.setItem('access_token', token);
        window.dispatchEvent(new CustomEvent('tokenInjected'));
      },
      clearToken: () => {
        localStorage.removeItem('access_token');
        checkAuthStatus();
      },
      getAuthState: () => authState
    };
    
    console.log('🔧 Debug functions exposed: window.debugAuth');
  }, [checkAuthStatus]);

  const contextValue = {
    ...authState,
    login,
    logout,
    checkAuthStatus
  };

  console.log('🔐 AuthProvider state:', authState);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Global Search Modal Component with full translation support
const GlobalSearchModal = ({ onClose, language, isRTL, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Translation helper
  const t = (key) => {
    const translations = {
      ar: {
        globalSearch: 'البحث الشامل',
        searchPlaceholder: 'ابحث في النظام...',
        searching: 'جاري البحث...',
        searchResults: 'نتائج البحث ({count})',
        noResults: 'لا توجد نتائج مطابقة',
        noResultsDesc: 'لم يتم العثور على نتائج لـ "{query}"',
        searchError: 'خطأ في البحث',
        searchErrorDesc: 'حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى',
        userManagement: 'إدارة المستخدمين',
        clinicsManagement: 'إدارة العيادات',
        productsManagement: 'إدارة المنتجات',
        accounting: 'الحسابات والفواتير',
        systemSearch: 'بحث',
        system: 'نظام',
        noEmail: 'لا يوجد بريد إلكتروني',
        doctor: 'د.',
        unspecified: 'غير محدد',
        priceHidden: 'السعر مخفي',
        currency: 'ج.م',
        paid: 'مدفوعة',
        pending: 'معلقة',
        partial: 'جزئية'
      },
      en: {
        globalSearch: 'Global Search',
        searchPlaceholder: 'Search the system...',
        searching: 'Searching...',
        searchResults: 'Search Results ({count})',
        noResults: 'No matching results',
        noResultsDesc: 'No results found for "{query}"',
        searchError: 'Search Error',
        searchErrorDesc: 'An error occurred while searching, please try again',
        userManagement: 'User Management',
        clinicsManagement: 'Clinics Management',
        productsManagement: 'Products Management',
        accounting: 'Accounting & Invoices',
        systemSearch: 'Search',
        system: 'System',
        noEmail: 'No email',
        doctor: 'Dr.',
        unspecified: 'Unspecified',
        priceHidden: 'Price hidden',
        currency: 'EGP',
        paid: 'Paid',
        pending: 'Pending',
        partial: 'Partial'
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let results = [];
      
      // Search across multiple APIs
      const [usersRes, clinicsRes, productsRes, invoicesRes] = await Promise.allSettled([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinics?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/invoices?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Process Users
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data || [];
        results.push(...users.slice(0, 3).map(user => ({
          id: `user-${user.id}`,
          type: 'user',
          title: user.full_name || user.username,
          description: `${user.role} - ${user.email || t('noEmail')}`,
          module: t('userManagement'),
          icon: '👤',
          action: () => setActiveTab('users')
        })));
      }

      // Process Clinics
      if (clinicsRes.status === 'fulfilled') {
        const clinics = clinicsRes.value.data || [];
        results.push(...clinics.slice(0, 3).map(clinic => ({
          id: `clinic-${clinic.id}`,
          type: 'clinic',
          title: clinic.clinic_name,
          description: `${t('doctor')} ${clinic.doctor_name} - ${clinic.address}`,
          module: t('clinicsManagement'),
          icon: '🏥',
          action: () => setActiveTab('clinics-management')
        })));
      }

      // Process Products
      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value.data || [];
        results.push(...products.slice(0, 3).map(product => ({
          id: `product-${product.id}`,
          type: 'product',
          title: product.name,
          description: `${product.category || t('unspecified')} - ${product.unit} - ${product.price || t('priceHidden')} ${t('currency')}`,
          module: t('productsManagement'),
          icon: '📦',
          action: () => setActiveTab('products')
        })));
      }

      // Process Invoices
      if (invoicesRes.status === 'fulfilled') {
        const invoices = invoicesRes.value.data || [];
        results.push(...invoices.slice(0, 3).map(invoice => {
          let statusText = invoice.status;
          if (invoice.status === 'paid') statusText = t('paid');
          else if (invoice.status === 'pending') statusText = t('pending');
          else if (invoice.status === 'partial') statusText = t('partial');
          
          return {
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            title: invoice.invoice_number,
            description: `${invoice.clinic_name} - ${invoice.total_amount} ${t('currency')} - ${statusText}`,
            module: t('accounting'),
            icon: '🧾',
            action: () => setActiveTab('accounting')
          };
        }));
      }

      // Add mock data if no API results
      if (results.length === 0) {
        // Search in system tabs
        Object.values(SYSTEM_TABS).forEach(tab => {
          const tabName = tab.name[language] || tab.name.en || tab.id;
          const tabDesc = tab.description[language] || tab.description.en || '';
          
          if (tabName.toLowerCase().includes(query.toLowerCase()) || 
              tabDesc.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: tab.id,
              type: 'navigation',
              title: tabName,
              description: tabDesc,
              module: t('system'),
              icon: tab.icon || '📄',
              action: () => setActiveTab(tab.id)
            });
          }
        });

        // Mock data for common searches
        if (query.toLowerCase().includes('فاتورة') || query.toUpperCase().includes('INV')) {
          results.push({
            id: 'invoice-demo',
            type: 'invoice',
            title: 'INV-2024-001',
            description: language === 'ar' ? 'عيادة الدكتور أحمد محمد - 1,250 ج.م - مدفوعة' : 'Dr. Ahmed Mohamed Clinic - 1,250 EGP - Paid',
            module: t('accounting'),
            icon: '🧾',
            action: () => setActiveTab('accounting')
          });
        }
        
        if (query.toLowerCase().includes('دكتور') || query.toLowerCase().includes('طبيب') || query.toLowerCase().includes('doctor')) {
          results.push({
            id: 'doctor-demo',
            type: 'clinic',
            title: language === 'ar' ? 'عيادة الدكتور أحمد محمد' : 'Dr. Ahmed Mohamed Clinic',
            description: language === 'ar' ? 'د. أحمد محمد - أمراض باطنة - القاهرة' : 'Dr. Ahmed Mohamed - Internal Medicine - Cairo',
            module: t('clinicsManagement'),
            icon: '🏥',
            action: () => setActiveTab('clinics-management')
          });
        }

        if (query.toLowerCase().includes('مستخدم') || query.toLowerCase().includes('admin') || query.toLowerCase().includes('user')) {
          results.push({
            id: 'user-demo',
            type: 'user',
            title: language === 'ar' ? 'أحمد محمد علي' : 'Ahmed Mohamed Ali',
            description: 'admin - admin@example.com',
            module: t('userManagement'),
            icon: '👤',
            action: () => setActiveTab('users')
          });
        }

        if (!results.length && query.trim()) {
          results.push({
            id: 'no-results',
            type: 'info',
            title: t('noResults'),
            description: t('noResultsDesc').replace('{query}', query),
            module: t('systemSearch'),
            icon: '🔍',
            action: () => {}
          });
        }
      }
      
      setSearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        setSearchResults([{
          id: 'error',
          type: 'error',
          title: t('searchError'),
          description: t('searchErrorDesc'),
          module: t('system'),
          icon: '⚠️',
          action: () => {}
        }]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          handleSearch(searchQuery);
        } else {
          setSearchResults([]);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [searchQuery, language]);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl mx-4 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {t('globalSearch')}
            </h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 text-white placeholder-white/50"
              autoFocus
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50">
              🔍
            </span>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-white/70">{t('searching')}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-white/80 mb-3">
                {t('searchResults').replace('{count}', searchResults.length)}
              </h4>
              {searchResults.map(result => (
                <div 
                  key={result.id} 
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    if (result.action) {
                      result.action();
                      onClose();
                    }
                  }}
                >
                  <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    <span className="text-2xl">{result.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-medium text-white">{result.title}</h5>
                      <p className="text-sm text-white/70">{result.description}</p>
                      <span className="text-xs text-blue-300">{result.module}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8 text-white/70">
              <div className="text-4xl mb-2">🔍</div>
              <p>{t('noResults')}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

// Theme Selector Component
const ThemeSelector = ({ language, availableThemes, currentTheme, onThemeChange }) => {
  const [showThemes, setShowThemes] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowThemes(!showThemes)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
        title={language === 'ar' ? 'تغيير الثيم' : 'Change Theme'}
      >
        <span>🎨</span>
        <span className="text-sm hidden md:inline">
          {language === 'ar' ? availableThemes[currentTheme]?.name.ar : availableThemes[currentTheme]?.name.en}
        </span>
      </button>

      {showThemes && (
        <div className="absolute top-full right-0 mt-2 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 py-2 min-w-[200px] z-50">
          {Object.entries(availableThemes).map(([themeKey, themeConfig]) => (
            <button
              key={themeKey}
              onClick={() => {
                onThemeChange(themeKey);
                setShowThemes(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${
                currentTheme === themeKey ? 'bg-white/20' : ''
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${themeConfig.colors.primary}`}></div>
              <span>{language === 'ar' ? themeConfig.name.ar : themeConfig.name.en}</span>
              {currentTheme === themeKey && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Keyboard Shortcuts Handler
const KeyboardShortcuts = ({ onSearchOpen }) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      // Ctrl+K or Cmd+K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onSearchOpen();
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        // This will be handled by individual modal components
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onSearchOpen]);

  return null;
};

// Custom Hooks
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Enhanced Login Form with direct token handling
const LoginForm = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 LoginForm handleSubmit called');
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Calling login function...');
      const result = await login(credentials);
      
      if (result.success) {
        console.log('✅ Login successful!');
        // Force immediate re-render by triggering custom event
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Direct API call if useAuth login doesn't work
  const handleDirectLogin = async () => {
    console.log('🚀 Direct login attempt...');
    setLoading(true);
    setError('');

    try {
      const API_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        
        // Use the debug function to update auth state
        if (window.debugAuth) {
          window.debugAuth.setToken(data.access_token);
        } else {
          // Fallback: trigger custom event
          window.dispatchEvent(new CustomEvent('tokenInjected'));
        }
        
        console.log('✅ Direct login successful!');
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Direct login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-white">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            نظام الإدارة الطبية المتكامل
          </h1>
          <p className="text-white/70 text-sm">
            Comprehensive Medical & Pharmaceutical Management System
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <button
              type="button"
              onClick={handleDirectLogin}
              disabled={loading || !credentials.username || !credentials.password}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Processing...' : 'Direct Login (Backup)'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-white/50 text-sm">
          نظام الإدارة الطبية • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Layout
const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    system: {
      app_name: 'نظام الإدارة الطبية المتكامل',
      company_logo: ''
    }
  });
  
  const { user, logout } = useAuth();
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    isRTL,
    setIsRTL,
    toggleLanguage,
    changeTheme, 
    getCurrentTheme, 
    availableThemes,
    showGlobalSearch,
    setShowGlobalSearch 
  } = useTheme();
  const { t } = useTranslation(language);

  // Handle global search
  const handleGlobalSearch = async (query, type) => {
    console.log(`🔍 Global search: ${query} (type: ${type})`);
    // Implement search logic here
    // Return mock results for now
    return [
      { id: 1, type: 'clinic', title: 'عيادة الدكتور أحمد', subtitle: 'القاهرة', icon: '🏥' },
      { id: 2, type: 'user', title: 'محمد علي', subtitle: 'مندوب طبي', icon: '👤' },
      { id: 3, type: 'invoice', title: 'فاتورة #12345', subtitle: '1500 ج.م', icon: '📄' }
    ];
  };

  // Get available tabs for current user with fallback
  const availableTabs = useMemo(() => {
    if (!user || !user.role) {
      console.warn('User or user.role is undefined, returning default dashboard tab');
      // Return a safe default tab for unauthenticated users
      return [SYSTEM_TABS.dashboard || { id: 'dashboard', name: { ar: 'لوحة التحكم' }, component: 'Dashboard' }];
    }
    
    try {
      return getAvailableTabs(user.role);
    } catch (error) {
      console.error('Error getting available tabs:', error);
      // Return safe fallback
      return [SYSTEM_TABS.dashboard || { id: 'dashboard', name: { ar: 'لوحة التحكم' }, component: 'Dashboard' }];
    }
  }, [user?.role]);
  
  const currentThemeConfig = getCurrentTheme();

  // Global function for switching tabs - CRITICAL FOR QUICK ACTIONS
  const switchToTab = useCallback((tabName) => {
    console.log(`🔄 Quick Action: Switching to tab: ${tabName}`);
    setActiveTab(tabName);
    setShowThemes(false);
    setShowUserProfile(false);
    setShowUserSettings(false);
    console.log(`✅ Quick Action completed: Tab switched to ${tabName}`);
  }, []);

  // Make switchToTab available globally for Dashboard quick actions
  useEffect(() => {
    window.switchToTab = switchToTab;
    console.log('🌍 switchToTab function made globally available');
    
    // Add event listener for navigation from Quick Actions and Activity Log
    const handleNavigateToSection = (event) => {
      const sectionName = event.detail;
      console.log(`🚀 Quick Action Navigation: ${sectionName}`);
      switchToTab(sectionName);
    };
    
    window.addEventListener('navigateToSection', handleNavigateToSection);
    
    return () => {
      delete window.switchToTab;
      window.removeEventListener('navigateToSection', handleNavigateToSection);
      console.log('🌍 switchToTab function and navigation listeners removed');
    };
  }, [switchToTab]);

  // Load system settings
  const loadSystemSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const settings = await response.json();
        setSystemSettings(settings);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  useEffect(() => {
    loadSystemSettings();
  }, []);

  // Set default tab if current tab is not available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Add scroll listener for glassy header effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setHeaderScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`dashboard-layout theme-${theme} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Professional Header - Complete New Implementation */}
      <ModernProfessionalHeader 
        user={user}
        language={language}
        setLanguage={(newLang) => {
          setLanguage(newLang);
          setIsRTL(newLang === 'ar');
        }}
        theme={theme}
        setTheme={changeTheme}
        isRTL={isRTL}
        setIsRTL={setIsRTL}
        onSearch={handleGlobalSearch}
        systemSettings={systemSettings}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        availableThemes={AVAILABLE_THEMES} // Pass available themes
      />

      {/* Modern Sidebar */}
      <ModernSidebar 
        activeTab={activeTab}
        switchTab={setActiveTab}
        currentUser={user}
        isCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        language={language}
        isRTL={isRTL}
        theme={theme}
      />

      {/* Main Dashboard Content - Perfect alignment without empty spaces */}
      <div className={`dashboard-content transition-all duration-300 ${
        sidebarCollapsed ? 'mr-16' : 'mr-80'
      }`} style={{ paddingTop: '64px', marginTop: '0' }}> {/* Exact padding, no margin */}
        {/* Main Content */}
        <main className="dashboard-main flex-1 overflow-auto min-h-screen"> 
          {/* Current Tab Component */}
          <div className="tab-content">
            {(() => {
              const currentTab = Object.values(SYSTEM_TABS).find(tab => tab.id === activeTab);
              const componentName = currentTab?.component;
              
              console.log('🔍 Tab Resolution Debug:', {
                activeTab,
                currentTab: currentTab ? {
                  id: currentTab.id,
                  name: currentTab.name,
                  component: currentTab.component
                } : null,
                componentName,
                availableTabs: Object.values(SYSTEM_TABS).map(t => ({ id: t.id, component: t.component }))
              });
              
              return (
                <ComponentRenderer
                  componentName={componentName}
                  user={user}
                  language={language}
                  isRTL={isRTL}
                  theme={theme}
                />
              );
            })()}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <GlobalSearchModal
          onClose={() => setShowGlobalSearch(false)}
          language={language}
          isRTL={isRTL}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Global Keyboard Shortcuts */}
      <div style={{ display: 'none' }}>
        {/* Keyboard shortcuts handler */}
        {typeof window !== 'undefined' && (
          <KeyboardShortcuts 
            onSearchOpen={() => setShowGlobalSearch(true)} 
          />
        )}
      </div>

      {/* Enhanced User Profile Modal with Professional Design */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl mx-4 border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">الملف الشخصي</h3>
                    <p className="text-blue-100">معلومات المستخدم الشاملة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2">
                    معلومات شخصية
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الاسم الكامل
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium">
                      {user?.full_name || user?.username || 'غير متوفر'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اسم المستخدم
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium">
                      {user?.username || 'غير متوفر'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium">
                      {user?.email || 'غير متوفر'}
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2">
                    معلومات النظام
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الدور
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        user?.role === 'medical_rep' ? 'bg-green-100 text-green-800' :
                        user?.role === 'accountant' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.role === 'admin' ? '👨‍💼 مدير النظام' :
                         user?.role === 'manager' ? '👨‍💼 مدير' :
                         user?.role === 'medical_rep' ? '👨‍⚕️ مندوب طبي' :
                         user?.role === 'accountant' ? '💰 محاسب' :
                         user?.role || 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      حالة الحساب
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user?.is_active ? '✅ نشط' : '❌ غير نشط'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      معرف المستخدم
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm">
                      {user?.user_id || user?.id || 'غير متوفر'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تاريخ الإنشاء
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      }) : 'غير متوفر'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-gray-200 px-8 py-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowUserProfile(false);
                    // Navigate to User Management section to edit profile
                    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'users' }));
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  📝 تعديل الملف الشخصي
                </button>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {showUserSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">الإعدادات</h3>
              <button
                onClick={() => setShowUserSettings(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">اللغة</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الثيم</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg">
                  <option value="dark">داكن</option>
                  <option value="light">فاتح</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, ${currentThemeConfig.colors.background});
          color: ${currentThemeConfig.colors.text};
          transition: all 0.3s ease;
        }

        .theme-modern .dashboard-layout {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(147, 51, 234, 0.1) 50%, 
            rgba(79, 70, 229, 0.1) 100%
          );
        }

        .theme-minimal .dashboard-layout {
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 1) 0%, 
            rgba(229, 231, 235, 1) 100%
          );
          color: #1f2937;
        }

        .theme-glassy .dashboard-layout {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.9) 0%, 
            rgba(88, 28, 135, 0.9) 50%, 
            rgba(15, 23, 42, 0.9) 100%
          );
          backdrop-filter: blur(20px);
        }

        .theme-dark .dashboard-layout {
          background: linear-gradient(135deg, 
            rgba(17, 24, 39, 1) 0%, 
            rgba(88, 28, 135, 0.3) 50%, 
            rgba(67, 56, 202, 0.3) 100%
          );
        }

        .theme-white .dashboard-layout {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(243, 244, 246, 1) 100%
          );
          color: #1f2937;
        }

        .dashboard-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 40;
          height: 64px;
          backdrop-filter: blur(20px);
        }

        .dashboard-content {
          padding-top: 64px;
          min-height: 100vh;
        }

        .dashboard-sidebar {
          position: fixed;
          right: 0;
          top: 64px;
          bottom: 0;
          z-index: 30;
          overflow-y: auto;
        }

        .dashboard-main {
          background: ${currentThemeConfig.colors.card};
          backdrop-filter: blur(10px);
          transition: margin-right 0.3s ease;
        }

        .tab-content {
          background: ${currentThemeConfig.colors.card};
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: calc(100vh - 160px);
        }

        /* RTL Support */
        .rtl {
          direction: rtl;
        }

        .rtl .dashboard-sidebar {
          border-left: none;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Theme-specific adjustments */
        .theme-minimal .tab-content,
        .theme-white .tab-content {
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .theme-glassy .tab-content {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
      <p className="text-white/80">جاري التحميل...</p>
    </div>
  </div>
);

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
  const { loading, isAuthenticated, user } = useAuth();
  
  // Debug logging for authentication state
  console.log('🔍 AppContent render:', { loading, isAuthenticated, user: user?.username });

  if (loading) {
    console.log('⏳ App is loading...');
    return <LoadingSpinner />;
  }

  // Authentication decision
  console.log('🎯 Rendering:', isAuthenticated ? 'DashboardLayout' : 'LoginForm');
  
  return isAuthenticated ? <DashboardLayout /> : <LoginForm />;
};

export default App;