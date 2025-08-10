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
  const [expandedSections, setExpandedSections] = useState({});

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
        fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full bg-white shadow-xl border-${isRTL ? 'l' : 'r'} border-gray-200 z-40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-80'}
        flex flex-col
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">🏥</span>
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold">
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
          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white transition-colors"
          title={isCollapsed ? (language === 'ar' ? 'توسيع القائمة' : 'Expand Menu') : (language === 'ar' ? 'طي القائمة' : 'Collapse Menu')}
        >
          {isCollapsed ? '📖' : (isRTL ? '📖' : '📕')}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {Object.entries(groupedTabs).map(([sectionKey, section]) => (
          <div key={sectionKey} className="mb-2">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionKey)}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-${isRTL ? 'right' : 'left'}
                hover:bg-gray-50 transition-colors group
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                {!isCollapsed && (
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                    {section.title}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className={`transform transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
                  ⌄
                </span>
              )}
            </button>

            {/* Section Items */}
            {(expandedSections[sectionKey] || isCollapsed) && (
              <div className={isCollapsed ? '' : `${isRTL ? 'mr-8' : 'ml-8'}`}>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-${isRTL ? 'right' : 'left'}
                      transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.title : item.description}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {!isCollapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              {language === 'ar' ? 'نظام الإدارة الطبية المتكامل' : 'Integrated Medical Management System'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>🇪🇬</span>
              <span>{language === 'ar' ? 'مصر' : 'Egypt'}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-lg">🇪🇬</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSidebar;