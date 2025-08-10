import React, { useState, useMemo } from 'react';
import { SYSTEM_TABS, getAvailableTabs } from '../../config/systemConfig';

const ModernSidebar = ({ 
  isCollapsed, 
  toggleSidebar, 
  activeTab, 
  switchTab, 
  currentUser, 
  isRTL = false,  // Default to LTR (English)
  language = 'en' // Default to English
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

  return (
    <div 
      className={`
        fixed top-0 right-0 h-full bg-gradient-to-b from-gray-50 to-white shadow-2xl border-l border-gray-200 z-40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-80'}
        flex flex-col
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg">
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
                hover:bg-blue-50 transition-all duration-200 group border-r-4 border-transparent
                hover:border-r-blue-400
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                {!isCollapsed && (
                  <span className="font-semibold text-gray-800 group-hover:text-blue-700">
                    {section.title}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className={`
                  transform transition-transform text-gray-500 group-hover:text-blue-600
                  ${expandedSections[sectionKey] ? 'rotate-180' : ''}
                `}>
                  ▼
                </span>
              )}
            </button>

            {/* Section Items */}
            {(expandedSections[sectionKey] || isCollapsed) && (
              <div className={isCollapsed ? '' : `pr-4 mr-6 border-r border-gray-200`}>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-right
                      transition-all duration-200 relative
                      ${activeTab === item.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-r-4 border-blue-600 shadow-md' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent hover:border-gray-300'
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                      group
                    `}
                    title={isCollapsed ? item.title : item.description}
                  >
                    {/* Active indicator */}
                    {activeTab === item.id && !isCollapsed && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full"></div>
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
                          <div className="text-xs text-gray-500 truncate mt-0.5">
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
      <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🏥</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {language === 'ar' ? 'نظام الإدارة الطبية' : 'Medical Management System'}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? 'الإصدار 2.1.0' : 'Version 2.1.0'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
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