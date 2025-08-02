// EP Group System - Main Application (Reorganized & Centralized)
// النظام الرئيسي لمجموعة EP - منظم ومركزي

import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

// Central System Imports
import { 
  SYSTEM_TABS, 
  USER_ROLES, 
  getAvailableTabs,
  hasPermission,
  normalizeRole 
} from './config/systemConfig.js';
import NavigationSystem from './components/Navigation/NavigationSystem.js';
import { ComponentRenderer } from './components/Core/ComponentRegistry.js';
import { useTranslation } from './localization/translations.js';

// API Configuration
const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

// Context Definitions
const ThemeContext = createContext();
const AuthContext = createContext();

// Available Themes - الثيمات المتاحة
const AVAILABLE_THEMES = {
  modern: {
    name: { ar: 'عصري', en: 'Modern' },
    colors: {
      primary: 'from-blue-500 to-purple-600',
      secondary: 'from-purple-500 to-pink-500',
      background: 'from-gray-900 via-blue-900 to-indigo-900',
      card: 'bg-white/10',
      text: 'text-white'
    }
  },
  minimal: {
    name: { ar: 'بسيط', en: 'Minimal' },
    colors: {
      primary: 'from-gray-600 to-gray-800',
      secondary: 'from-gray-500 to-gray-700',
      background: 'from-gray-50 to-gray-200',
      card: 'bg-white/90',
      text: 'text-gray-900'
    }
  },
  glassy: {
    name: { ar: 'زجاجي', en: 'Glassy' },
    colors: {
      primary: 'from-cyan-400 to-blue-500',
      secondary: 'from-teal-400 to-cyan-500',
      background: 'from-slate-900 via-purple-900 to-slate-900',
      card: 'bg-white/5 backdrop-blur-xl',
      text: 'text-white'
    }
  },
  dark: {
    name: { ar: 'داكن', en: 'Dark' },
    colors: {
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-purple-600 to-pink-600',
      background: 'from-gray-900 via-purple-900 to-indigo-900',
      card: 'bg-gray-800/50',
      text: 'text-white'
    }
  },
  white: {
    name: { ar: 'أبيض', en: 'White' },
    colors: {
      primary: 'from-blue-600 to-indigo-600',
      secondary: 'from-indigo-600 to-purple-600',
      background: 'from-white to-gray-100',
      card: 'bg-white border border-gray-200',
      text: 'text-gray-900'
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
      document.body.className = `theme-${theme}`;
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
  
  const { user, logout } = useAuth();
  const { language, isRTL, toggleLanguage, toggleTheme, theme } = useTheme();
  const { t } = useTranslation(language);

  // Get available tabs for current user
  const availableTabs = getAvailableTabs(user?.role);

  // Set default tab if current tab is not available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  return (
    <div className={`dashboard-layout ${theme} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="dashboard-header bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="font-bold text-xl">EP Group</span>
            </div>
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium">{user?.full_name || user?.username}</div>
                <div className="text-sm opacity-75">{user?.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
                title={t('auth', 'logout')}
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content flex">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar bg-white/5 backdrop-blur-lg border-r border-white/20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          <div className="p-4">
            {!sidebarCollapsed && (
              <NavigationSystem
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                language={language}
                isRTL={isRTL}
              />
            )}
            
            {sidebarCollapsed && (
              <div className="space-y-2">
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main flex-1 p-6 overflow-auto">
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
      </div>

      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(147, 51, 234, 0.1) 50%, 
            rgba(79, 70, 229, 0.1) 100%
          );
          color: var(--text-primary);
        }

        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dashboard-content {
          min-height: calc(100vh - 80px);
        }

        .dashboard-sidebar {
          min-height: calc(100vh - 80px);
          overflow-y: auto;
        }

        .dashboard-main {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
        }

        .tab-content {
          background: rgba(255, 255, 255, 0.05);
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
          border-right: none;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
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