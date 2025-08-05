// EP Group System - Main Application (Reorganized & Centralized)
// النظام الرئيسي لمجموعة EP - منظم ومركزي

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import './App.css';
import axios from 'axios';

// Professional Header Import
import ProfessionalHeader from './components/Common/ProfessionalHeader.js';

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

// API Configuration
const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

// Context Definitions
const ThemeContext = createContext();
const AuthContext = createContext();

// Available Themes - ثيمات عصرية محدثة 2025 مع تناسق بصري مثالي
const AVAILABLE_THEMES = {
  // ثيم الليل الأنيق - Night Elegance
  dark: {
    name: { ar: 'الليل الأنيق', en: 'Night Elegance' },
    colors: {
      primary: 'from-slate-800 to-gray-900',
      secondary: 'from-gray-900 to-slate-900',
      background: 'from-slate-900 via-gray-900 to-zinc-900',
      card: 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/60',
      text: 'text-slate-50'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #111827 100%)',
      '--bg-secondary': 'rgba(30, 41, 59, 0.8)',
      '--bg-card': 'rgba(30, 41, 59, 0.95)',
      '--text-primary': '#f8fafc',
      '--text-secondary': 'rgba(248, 250, 252, 0.85)',
      '--text-muted': 'rgba(248, 250, 252, 0.65)',
      '--border-color': 'rgba(148, 163, 184, 0.3)',
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#6366f1',
      '--shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
    },
    dropdown: {
      background: 'rgba(30, 41, 59, 0.98)',
      text: '#f8fafc',
      hover: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(148, 163, 184, 0.4)'
    }
  },
  
  // ثيم الصباح المشرق - Bright Morning
  light: {
    name: { ar: 'الصباح المشرق', en: 'Bright Morning' },
    colors: {
      primary: 'from-blue-50 to-indigo-50',
      secondary: 'from-indigo-50 to-blue-100',
      background: 'from-blue-50/80 via-slate-50 to-gray-50',
      card: 'bg-white/95 backdrop-blur-xl border border-blue-200/40',
      text: 'text-gray-800'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      '--bg-secondary': 'rgba(255, 255, 255, 0.9)',
      '--bg-card': 'rgba(255, 255, 255, 0.95)',
      '--text-primary': '#1e293b',
      '--text-secondary': 'rgba(30, 41, 59, 0.85)',
      '--text-muted': 'rgba(30, 41, 59, 0.65)',
      '--border-color': 'rgba(148, 163, 184, 0.2)',
      '--accent-primary': '#2563eb',
      '--accent-secondary': '#3b82f6',
      '--shadow': '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
    },
    dropdown: {
      background: 'rgba(255, 255, 255, 0.98)',
      text: '#1e293b',
      hover: 'rgba(37, 99, 235, 0.1)',
      border: 'rgba(148, 163, 184, 0.3)'
    }
  },
  
  // ثيم الغروب الذهبي - Golden Sunset
  golden: {
    name: { ar: 'الغروب الذهبي', en: 'Golden Sunset' },
    colors: {
      primary: 'from-amber-600 to-orange-600',
      secondary: 'from-orange-600 to-red-600',
      background: 'from-amber-50 via-orange-50 to-red-50',
      card: 'bg-white/90 backdrop-blur-xl border border-amber-200/60',
      text: 'text-amber-900'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)',
      '--bg-secondary': 'rgba(252, 211, 77, 0.1)',
      '--bg-card': 'rgba(255, 255, 255, 0.9)',
      '--text-primary': '#92400e',
      '--text-secondary': 'rgba(146, 64, 14, 0.85)',
      '--text-muted': 'rgba(146, 64, 14, 0.65)',
      '--border-color': 'rgba(217, 119, 6, 0.3)',
      '--accent-primary': '#d97706',
      '--accent-secondary': '#f59e0b',
      '--shadow': '0 10px 25px -3px rgba(217, 119, 6, 0.2)'
    },
    dropdown: {
      background: 'rgba(255, 255, 255, 0.98)',
      text: '#92400e',
      hover: 'rgba(217, 119, 6, 0.15)',
      border: 'rgba(217, 119, 6, 0.4)'
    }
  },
  
  // ثيم المحيط العميق - Deep Ocean
  ocean: {
    name: { ar: 'المحيط العميق', en: 'Deep Ocean' },
    colors: {
      primary: 'from-cyan-900 to-blue-900',
      secondary: 'from-blue-900 to-indigo-900',
      background: 'from-slate-900 via-cyan-900/80 to-blue-900/70',
      card: 'bg-cyan-950/80 backdrop-blur-xl border border-cyan-700/40',
      text: 'text-cyan-50'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #0f172a 0%, #164e63 50%, #1e3a8a 100%)',
      '--bg-secondary': 'rgba(6, 95, 133, 0.2)',
      '--bg-card': 'rgba(8, 47, 73, 0.8)',
      '--text-primary': '#ecfeff',
      '--text-secondary': 'rgba(236, 254, 255, 0.85)',
      '--text-muted': 'rgba(236, 254, 255, 0.65)',
      '--border-color': 'rgba(6, 182, 212, 0.4)',
      '--accent-primary': '#06b6d4',
      '--accent-secondary': '#0891b2',
      '--shadow': '0 25px 50px -12px rgba(6, 95, 133, 0.5)'
    },
    dropdown: {
      background: 'rgba(8, 47, 73, 0.98)',
      text: '#ecfeff',
      hover: 'rgba(6, 182, 212, 0.2)',
      border: 'rgba(6, 182, 212, 0.5)'
    }
  },
  
  // ثيم الغابة الخضراء - Emerald Forest
  forest: {
    name: { ar: 'الغابة الخضراء', en: 'Emerald Forest' },
    colors: {
      primary: 'from-emerald-800 to-green-800',
      secondary: 'from-green-800 to-teal-800',
      background: 'from-emerald-50 via-green-50 to-teal-50',
      card: 'bg-white/90 backdrop-blur-xl border border-emerald-200/60',
      text: 'text-emerald-900'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #f0f9ff 100%)',
      '--bg-secondary': 'rgba(16, 185, 129, 0.1)',
      '--bg-card': 'rgba(255, 255, 255, 0.9)',
      '--text-primary': '#064e3b',
      '--text-secondary': 'rgba(6, 78, 59, 0.85)',
      '--text-muted': 'rgba(6, 78, 59, 0.65)',
      '--border-color': 'rgba(16, 185, 129, 0.3)',
      '--accent-primary': '#10b981',
      '--accent-secondary': '#059669',
      '--shadow': '0 10px 25px -3px rgba(16, 185, 129, 0.2)'
    },
    dropdown: {
      background: 'rgba(255, 255, 255, 0.98)',
      text: '#064e3b',
      hover: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)'
    }
  },
  
  // ثيم البنفسج الكوني - Cosmic Purple
  cosmic: {
    name: { ar: 'البنفسج الكوني', en: 'Cosmic Purple' },
    colors: {
      primary: 'from-violet-900 to-purple-900',
      secondary: 'from-purple-900 to-fuchsia-900',
      background: 'from-slate-900 via-violet-900/80 to-purple-900/70',
      card: 'bg-violet-950/80 backdrop-blur-xl border border-violet-700/40',
      text: 'text-violet-50'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #7c2d12 100%)',
      '--bg-secondary': 'rgba(124, 58, 237, 0.2)',
      '--bg-card': 'rgba(76, 29, 149, 0.8)',
      '--text-primary': '#f3e8ff',
      '--text-secondary': 'rgba(243, 232, 255, 0.85)',
      '--text-muted': 'rgba(243, 232, 255, 0.65)',
      '--border-color': 'rgba(147, 51, 234, 0.4)',
      '--accent-primary': '#9333ea',
      '--accent-secondary': '#a855f7',
      '--shadow': '0 25px 50px -12px rgba(124, 58, 237, 0.5)'
    },
    dropdown: {
      background: 'rgba(76, 29, 149, 0.98)',
      text: '#f3e8ff',
      hover: 'rgba(147, 51, 234, 0.2)',
      border: 'rgba(147, 51, 234, 0.5)'
    }
  },
  
  // ثيم الورد الناعم - Soft Rose
  rose: {
    name: { ar: 'الورد الناعم', en: 'Soft Rose' },
    colors: {
      primary: 'from-rose-600 to-pink-600',
      secondary: 'from-pink-600 to-fuchsia-600',
      background: 'from-rose-50 via-pink-50 to-fuchsia-50',
      card: 'bg-white/90 backdrop-blur-xl border border-rose-200/60',
      text: 'text-rose-900'
    },
    css: {
      '--bg-primary': 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #fdf4ff 100%)',
      '--bg-secondary': 'rgba(244, 63, 94, 0.1)',
      '--bg-card': 'rgba(255, 255, 255, 0.9)',
      '--text-primary': '#881337',
      '--text-secondary': 'rgba(136, 19, 55, 0.85)',
      '--text-muted': 'rgba(136, 19, 55, 0.65)',
      '--border-color': 'rgba(244, 63, 94, 0.3)',
      '--accent-primary': '#f43f5e',
      '--accent-secondary': '#e11d48',
      '--shadow': '0 10px 25px -3px rgba(244, 63, 94, 0.2)'
    },
    dropdown: {
      background: 'rgba(255, 255, 255, 0.98)',
      text: '#881337',
      hover: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.4)'
    }
  }
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');
  const [theme, setTheme] = useState('dark');
  const [isRTL, setIsRTL] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    
    // Apply theme to body
    const themeConfig = AVAILABLE_THEMES[theme];
    if (themeConfig) {
      // Remove all theme classes first
      document.body.classList.remove('theme-modern', 'theme-minimal', 'theme-glassy', 'theme-dark', 'theme-white', 'theme-cosmic', 'theme-golden', 'theme-professional');
      // Add current theme class
      document.body.classList.add(`theme-${theme}`);
      
      // Apply CSS variables to root
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', themeConfig.colors.background);
      root.style.setProperty('--bg-card', themeConfig.colors.card);
      root.style.setProperty('--text-primary', themeConfig.colors.text);
      
      // Apply dropdown variables for enhanced theme support
      if (themeConfig.dropdown) {
        root.style.setProperty('--dropdown-bg', themeConfig.dropdown.background);
        root.style.setProperty('--dropdown-text', themeConfig.dropdown.text);
        root.style.setProperty('--dropdown-hover', themeConfig.dropdown.hover);
        root.style.setProperty('--dropdown-border', themeConfig.dropdown.border);
      }
      
      console.log(`✅ Applied enhanced theme with dropdown support: ${theme}`);
    }
  }, [isRTL, language, theme]);

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    setIsRTL(newLanguage === 'ar');
  };

  const changeTheme = (newTheme) => {
    if (AVAILABLE_THEMES[newTheme]) {
      setTheme(newTheme);
      console.log(`🎨 Changing theme to: ${newTheme}`);
      
      // Force immediate theme application with all enhanced themes
      setTimeout(() => {
        document.body.classList.remove('theme-modern', 'theme-minimal', 'theme-glassy', 'theme-dark', 'theme-golden', 'theme-professional', 'theme-cosmic');
        document.body.classList.add(`theme-${newTheme}`);
        
        const themeConfig = AVAILABLE_THEMES[newTheme];
        const root = document.documentElement;
        
        // Apply CSS variables immediately
        root.style.setProperty('--bg-primary', themeConfig.colors.background);
        root.style.setProperty('--bg-card', themeConfig.colors.card);
        root.style.setProperty('--text-primary', themeConfig.colors.text);
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.2)');
        
        console.log(`🎨 Enhanced theme applied: ${newTheme}`);
        
        // Force a re-render
        const event = new CustomEvent('themeChanged', { detail: { theme: newTheme } });
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

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to verify token with backend
      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (authError) {
        console.error('Auth verification failed:', authError);
        // If auth verification fails, try to decode token locally as fallback
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          if (tokenPayload.exp > Date.now() / 1000) {
            // Token is still valid, create user object from token
            const user = {
              id: tokenPayload.user_id,
              username: tokenPayload.username,
              role: tokenPayload.role,
              full_name: tokenPayload.username
            };
            setUser(user);
            setIsAuthenticated(true);
          } else {
            // Token expired
            localStorage.removeItem('access_token');
          }
        } catch (tokenError) {
          console.error('Token decode failed:', tokenError);
          localStorage.removeItem('access_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      isAuthenticated,
      login,
      logout,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Global Search Component
const GlobalSearchModal = ({ onClose, language, isRTL, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
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

      let results = [];

      // Process Users
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data || [];
        results.push(...users.slice(0, 3).map(user => ({
          id: `user-${user.id}`,
          type: 'user',
          title: user.full_name || user.username,
          description: `${user.role} - ${user.email || 'لا يوجد بريد إلكتروني'}`,
          module: 'إدارة المستخدمين',
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
          description: `د. ${clinic.doctor_name} - ${clinic.address}`,
          module: 'إدارة العيادات',
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
          description: `${product.category || 'غير محدد'} - ${product.unit} - ${product.price || 'السعر مخفي'} ج.م`,
          module: 'إدارة المنتجات',
          icon: '📦',
          action: () => setActiveTab('products')
        })));
      }

      // Process Invoices
      if (invoicesRes.status === 'fulfilled') {
        const invoices = invoicesRes.value.data || [];
        results.push(...invoices.slice(0, 3).map(invoice => ({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: invoice.invoice_number,
          description: `${invoice.clinic_name} - ${invoice.total_amount} ج.م - ${invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'معلقة' : 'جزئية'}`,
          module: 'الحسابات والفواتير',
          icon: '🧾',
          action: () => setActiveTab('accounting')
        })));
      }

      // Add mock data if no API results
      if (results.length === 0) {
        if (query.toLowerCase().includes('فاتورة') || query.toUpperCase().includes('INV')) {
          results.push({
            id: 'invoice-demo',
            type: 'invoice',
            title: 'INV-2024-001',
            description: 'عيادة الدكتور أحمد محمد - 1,250 ج.م - مدفوعة',
            module: 'الحسابات والفواتير',
            icon: '🧾',
            action: () => setActiveTab('accounting')
          });
        }
        
        if (query.toLowerCase().includes('دكتور') || query.toLowerCase().includes('طبيب')) {
          results.push({
            id: 'doctor-demo',
            type: 'clinic',
            title: 'عيادة الدكتور أحمد محمد',
            description: 'د. أحمد محمد - أمراض باطنة - القاهرة',
            module: 'إدارة العيادات',
            icon: '🏥',
            action: () => setActiveTab('clinics-management')
          });
        }

        if (query.toLowerCase().includes('مستخدم') || query.toLowerCase().includes('admin')) {
          results.push({
            id: 'user-demo',
            type: 'user',
            title: 'أحمد محمد علي',
            description: 'admin - admin@example.com',
            module: 'إدارة المستخدمين',
            icon: '👤',
            action: () => setActiveTab('users')
          });
        }

        if (!results.length && query.trim()) {
          results.push({
            id: 'no-results',
            type: 'info',
            title: 'لا توجد نتائج مطابقة',
            description: `لم يتم العثور على نتائج لـ "${query}"`,
            module: 'بحث',
            icon: '🔍',
            action: () => {}
          });
        }
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([{
        id: 'error',
        type: 'error',
        title: 'خطأ في البحث',
        description: 'حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى',
        module: 'نظام',
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
  }, [searchQuery]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl mx-4 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {language === 'ar' ? 'البحث الشامل' : 'Global Search'}
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
            placeholder={language === 'ar' ? 'ابحث في النظام...' : 'Search the system...'}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50">
            🔍
          </span>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
            <p className="text-white/70">جاري البحث...</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-white/80 mb-3">نتائج البحث ({searchResults.length})</h4>
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
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-white/60">{result.description}</div>
                    <div className="text-xs text-white/40 mt-1">{result.module}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery && !loading && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-white/70">لا توجد نتائج مطابقة</p>
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

// Login Component
const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { language } = useTheme();
  const { t } = useTranslation(language);

  const handleDemoCredentials = () => {
    setCredentials({ username: 'admin', password: 'admin123' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">EP Group System</h1>
          <p className="text-white/70">
            {language === 'ar' ? 'نظام إدارة شامل للمؤسسات الطبية' : 'Comprehensive Medical Institution Management'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              {t('auth', 'username')}
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth', 'username')}
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              {t('auth', 'password')}
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth', 'password')}
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleDemoCredentials}
              className="text-blue-300 hover:text-blue-200 text-sm"
            >
              {t('auth', 'demoCredentials')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? t('common', 'loading') : t('auth', 'login')}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-white/50 text-sm">
          EP Group System • {new Date().getFullYear()}
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
      app_name: 'EP Group System',
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

  // Get available tabs for current user
  const availableTabs = getAvailableTabs(user?.role);
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
    return () => {
      delete window.switchToTab;
      console.log('🌍 switchToTab function removed from global scope');
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
      <ProfessionalHeader 
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
      />

      {/* Main Dashboard Content with proper spacing for new header */}
      <div className="dashboard-content flex pt-16">
        {/* Main Content */}
        <main className={`dashboard-main flex-1 p-6 overflow-auto transition-all duration-300 ${
          sidebarCollapsed ? 'mr-16' : 'mr-80'
        }`}>
          {/* Current Tab Component */}
          <div className="tab-content">
            <ComponentRenderer
              componentName={Object.values(SYSTEM_TABS).find(tab => tab.id === activeTab)?.component}
              user={user}
              language={language}
              isRTL={isRTL}
            />
          </div>
        </main>

        <aside className={`dashboard-sidebar fixed right-0 top-16 bottom-0 bg-white/5 backdrop-blur-lg border-l border-white/20 transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          <div className="p-4">
            {!sidebarCollapsed && (
              <>
                {/* Enhanced User Profile Panel */}
                <div className="sidebar-user-panel mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="user-avatar-enhanced">
                      <span>
                        {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {user?.full_name || user?.username}
                      </div>
                      <div className="text-sm text-white/70 capitalize">
                        {language === 'ar' ? (user?.role === 'admin' ? 'مدير النظام' : user?.role) : user?.role}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Details Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{language === 'ar' ? 'معرف المستخدم' : 'User ID'}:</span>
                      <span className="text-white/90 font-mono text-xs">
                        {user?.id ? user.id.substring(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{language === 'ar' ? 'نشط منذ' : 'Active since'}:</span>
                      <span className="text-white/90">
                        {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{language === 'ar' ? 'الثيم الحالي' : 'Current Theme'}:</span>
                      <span className="text-white/90 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full theme-preview-${theme}`}></div>
                        {language === 'ar' ? availableThemes[theme]?.name.ar : availableThemes[theme]?.name.en}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{language === 'ar' ? 'اللغة' : 'Language'}:</span>
                      <span className="text-white/90">
                        {language === 'ar' ? 'العربية' : 'English'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                    <button 
                      onClick={() => setShowUserProfile(true)}
                      className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </button>
                    <button 
                      onClick={() => setShowUserSettings(true)}
                      className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      {language === 'ar' ? 'الإعدادات' : 'Settings'}
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <NavigationSystem
                  user={user}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  language={language}
                  isRTL={isRTL}
                />
              </>
            )}
            
            {sidebarCollapsed && (
              <div className="space-y-2">
                {/* Collapsed User Avatar */}
                <div className="w-full p-3 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <div className="user-avatar-enhanced w-8 h-8">
                    <span className="text-sm">
                      {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Collapsed Navigation */}
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-3 rounded-lg transition-all ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={language === 'ar' ? tab.name.ar : tab.name.en}
                  >
                    <span className="text-xl">{tab.icon}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 border border-white/20 backdrop-blur-sm"
              title={language === 'ar' ? (sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة') : (sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu')}
            >
              <span className={`text-sm transform transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}>
                {isRTL ? '◀' : '▶'}
              </span>
            </button>
          </div>
        </aside>
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

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">الملف الشخصي</h3>
              <button
                onClick={() => setShowUserProfile(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                <input 
                  type="text" 
                  value={user?.full_name || user?.username || ''} 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الدور</label>
                <input 
                  type="text" 
                  value={user?.role || ''} 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg"
                  readOnly
                />
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
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <DashboardLayout /> : <LoginForm />;
};

export default App;