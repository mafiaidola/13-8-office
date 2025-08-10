import React, { useState, useMemo } from 'react';
import { SYSTEM_TABS, getAvailableTabs } from '../../config/systemConfig';

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