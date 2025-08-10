import React, { useState, useMemo } from 'react';
import { SYSTEM_TABS, getAvailableTabs } from '../../config/systemConfig';

// Enhanced SVG Icon System - نظام الأيقونات المحسن
const SVGIcons = {
  // Dashboard & Analytics
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
    </svg>
  ),
  
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),

  // User Management
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),

  userProfile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),

  // Medical & Healthcare
  clinics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),

  medical: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),

  visits: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),

  // Products & Inventory
  products: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),

  inventory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),

  warehouse: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),

  // Financial
  finance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),

  invoices: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  orders: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),

  // Data & Reports
  excel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),

  // Location & GPS
  location: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  gps: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  map: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),

  // Activity & Tracking
  activity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),

  tracking: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),

  // Settings & Configuration
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  // Lines & Areas
  lines: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  ),

  areas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),

  // Default fallback
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
};

// Enhanced icon mapping for better visual organization
const getEnhancedIcon = (tabKey, iconKey = null) => {
  const iconMapping = {
    'dashboard': 'dashboard',
    'users': 'users',
    'products': 'products', 
    'warehouses': 'warehouse',
    'clinics': 'clinics',
    'visits': 'visits',
    'enhanced_clinic_registration': 'medical',
    'activity_tracking': 'activity',
    'excel': 'excel',
    'finance': 'finance',
    'unified_financial_dashboard': 'finance',
    'integrated_financial_dashboard': 'invoices',
    'lines_areas': 'lines',
    'settings': 'settings',
    'gps_tracking': 'gps',
    'reports': 'reports',
    'analytics': 'analytics'
  };
  
  const iconKey2 = iconKey || iconMapping[tabKey] || 'default';
  return SVGIcons[iconKey2] || SVGIcons.default;
};

const ModernSidebar = ({ 
  isCollapsed, 
  toggleSidebar, 
  activeTab, 
  switchTab, 
  currentUser, 
  isRTL = false,  // Default to LTR (English)
  language = 'en', // Default to English
  theme = 'dark'   // Add theme support
}) => {
  const [expandedSections, setExpandedSections] = useState({
    core: true,
    clinical: true,
    financial: true,
    inventory: true,
    analytics: true,
    system: true
  });

  // Get available tabs for current user
  const availableTabs = useMemo(() => {
    return getAvailableTabs(currentUser?.role || 'admin');
  }, [currentUser?.role]);

  // Group tabs by category
  const groupedTabs = useMemo(() => {
    const groups = {
      core: { 
        title: language === 'ar' ? 'العمليات الأساسية' : 'Core Operations', 
        icon: '🏠', 
        items: [] 
      },
      clinical: { 
        title: language === 'ar' ? 'العمليات الطبية' : 'Clinical Operations', 
        icon: '🏥', 
        items: [] 
      },
      financial: { 
        title: language === 'ar' ? 'الإدارة المالية' : 'Financial Management', 
        icon: '💰', 
        items: [] 
      },
      inventory: { 
        title: language === 'ar' ? 'المخزون والمنتجات' : 'Inventory & Products', 
        icon: '📦', 
        items: [] 
      },
      analytics: { 
        title: language === 'ar' ? 'التحليلات والتقارير' : 'Analytics & Reports', 
        icon: '📊', 
        items: [] 
      },
      system: { 
        title: language === 'ar' ? 'إدارة النظام' : 'System Management', 
        icon: '⚙️', 
        items: [] 
      }
    };

    availableTabs.forEach(tab => {
      const tabData = {
        id: tab.id,
        title: tab.name[language] || tab.name.en || tab.id,
        icon: tab.icon,
        path: tab.path,
        description: tab.description[language] || tab.description.en || ''
      };

      // Categorize tabs
      if (['dashboard'].includes(tab.id)) {
        groups.core.items.push(tabData);
      } else if (['clinic_registration', 'clinics_management', 'visits', 'lines_areas'].includes(tab.id)) {
        groups.clinical.items.push(tabData);
      } else if (['integrated_financial', 'accounting', 'debt_collection_management'].includes(tab.id)) {
        groups.financial.items.push(tabData);
      } else if (['products', 'orders', 'warehouses'].includes(tab.id)) {
        groups.inventory.items.push(tabData);
      } else if (['analytics', 'activity_tracking'].includes(tab.id)) {
        groups.analytics.items.push(tabData);
      } else if (['users', 'system_management', 'excel_management'].includes(tab.id)) {
        groups.system.items.push(tabData);
      } else {
        // Default to core for uncategorized items
        groups.core.items.push(tabData);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, group]) => group.items.length > 0)
    );
  }, [availableTabs, language]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Theme-based styling
  const isDark = theme === 'dark';
  const themeStyles = {
    sidebar: isDark 
      ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white' 
      : 'bg-gradient-to-b from-gray-50 to-white text-gray-900',
    header: isDark 
      ? 'bg-gradient-to-r from-blue-800 via-purple-800 to-indigo-800' 
      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600',
    sectionHeader: isDark 
      ? 'text-gray-200 hover:bg-gray-700/50 hover:text-blue-300' 
      : 'text-gray-800 hover:bg-blue-50 hover:text-blue-700',
    activeItem: isDark 
      ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 text-blue-300 border-blue-400' 
      : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-600',
    inactiveItem: isDark 
      ? 'text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 hover:border-gray-500' 
      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300',
    footer: isDark 
      ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
      : 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    accent: isDark ? 'border-gray-600' : 'border-gray-200'
  };

  return (
    <div 
      className={`
        fixed top-0 right-0 h-full shadow-2xl border-l z-40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-80'}
        flex flex-col
        ${themeStyles.sidebar} ${themeStyles.border}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 text-white shadow-lg ${themeStyles.header}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🏥</span>
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold leading-tight">
                {language === 'ar' ? 'نظام الإدارة الطبية' : 'Medical Management'}
              </h2>
              <p className="text-blue-100 text-sm">
                {language === 'ar' ? 'حل شامل للرعاية الصحية' : 'Comprehensive Healthcare Solution'}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110"
          title={isCollapsed ? (language === 'ar' ? 'توسيع القائمة' : 'Expand Menu') : (language === 'ar' ? 'طي القائمة' : 'Collapse Menu')}
        >
          {isCollapsed ? '📖' : '📕'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {Object.entries(groupedTabs).map(([sectionKey, section]) => (
          <div key={sectionKey} className="mb-1">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionKey)}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-right
                transition-all duration-200 group border-r-4 border-transparent
                ${themeStyles.sectionHeader}
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                {!isCollapsed && (
                  <span className="font-semibold">
                    {section.title}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className={`
                  transform transition-transform 
                  ${expandedSections[sectionKey] ? 'rotate-180' : ''}
                `}>
                  ▼
                </span>
              )}
            </button>

            {/* Section Items */}
            {(expandedSections[sectionKey] || isCollapsed) && (
              <div className={`${isCollapsed ? '' : `pr-4 mr-6 border-r ${themeStyles.accent}`}`}>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-right
                      transition-all duration-200 relative border-r-4 border-transparent
                      ${activeTab === item.id 
                        ? `${themeStyles.activeItem} shadow-md` 
                        : themeStyles.inactiveItem
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                      group
                    `}
                    title={isCollapsed ? item.title : item.description}
                  >
                    {/* Active indicator */}
                    {activeTab === item.id && !isCollapsed && (
                      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-l-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                    )}
                    
                    <span className={`text-lg flex-shrink-0 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 text-right">
                        <div className={`font-medium text-sm truncate ${activeTab === item.id ? 'font-bold' : ''}`}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${themeStyles.footer}`}>
        {!isCollapsed ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🏥</span>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {language === 'ar' ? 'نظام الإدارة الطبية' : 'Medical Management System'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'ar' ? 'الإصدار 2.1.0' : 'Version 2.1.0'}
                </p>
              </div>
            </div>
            <div className={`flex items-center justify-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              <span>🇪🇬</span>
              <span>{language === 'ar' ? 'مصر' : 'Egypt'}</span>
              <span>•</span>
              <span>2025</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🏥</span>
            <span className="text-lg">🇪🇬</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSidebar;